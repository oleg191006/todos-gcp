# GCP Todo API (Express + TypeScript)

A minimal REST API for a todo list. It runs locally with Firestore or an in-memory fallback, and is ready for Cloud Run deployment.

## Requirements

- Node.js 20+
- Google Cloud SDK (gcloud)

## Local run

1. Install dependencies:

   npm install

2. Copy env file:

   Copy .env.example to .env and set values if needed.

3. Start in dev mode:

   npm run dev

API is available at http://localhost:8080

## Endpoints

- GET /health
- GET /todos
- GET /todos/:id
- POST /todos { title, completed? }
- PUT /todos/:id { title?, completed? }
- DELETE /todos/:id

## Firebase Auth (optional)

This project can protect /todos with Firebase Auth ID tokens.

### 1) Create Firebase project

- Open Firebase Console and add Firebase to your existing GCP project.
- Enable Authentication > Sign-in method > Email/Password.

### 2) Create a test user

- Firebase Console > Authentication > Users > Add user.

### 3) Get an ID token (simple REST way)

- Find your Web API Key in Firebase Console > Project settings.
- Call the sign-in endpoint to get idToken:

  curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"YOUR_USER_EMAIL","password":"YOUR_PASSWORD","returnSecureToken":true}'

Copy the idToken value from the response.

### 4) Require auth in this API

- Set AUTH_REQUIRED=true in .env for local dev.
- For Cloud Run, set an env var AUTH_REQUIRED=true on the service.
- Send requests with header:

  Authorization: Bearer YOUR_ID_TOKEN

## Pub/Sub (todo.created events)

The API can publish a Pub/Sub event after a todo is created.

### GCP setup (done via gcloud)

- Enable Pub/Sub API
- Create topic: todo-created
- Grant Cloud Run service account: roles/pubsub.publisher

### App config

- Set PUBSUB_TOPIC=todo-created in .env for local dev
- In Cloud Run, add env var PUBSUB_TOPIC=todo-created

## Cloud Tasks (reminders)

The API can schedule reminders using Cloud Tasks. It creates a task that calls /tasks/remind after a delay.

### GCP setup (done via gcloud)

- Enable Cloud Tasks API
- Create a queue: todo-reminders in europe-central2
- Create a service account: todo-tasks-invoker
- Grant it: roles/run.invoker on the Cloud Run service
- Allow Cloud Tasks service agent to sign tokens for that service account
- Grant Cloud Run service account: roles/cloudtasks.enqueuer

### App config

- Set env vars:
  - TASKS_PROJECT_ID
  - TASKS_LOCATION
  - TASKS_QUEUE
  - TASKS_TARGET_URL (your Cloud Run URL + /tasks/remind)
  - TASKS_SERVICE_ACCOUNT_EMAIL
- Optional: TASKS_REQUIRE_HEADER=true (reject non-Cloud Tasks calls)

### Usage

POST /todos/:id/remind { delaySeconds: 60 }

## Logging & Monitoring

The API logs structured JSON to stdout. Cloud Run automatically ships it to Cloud Logging.

### Where to view logs

- Cloud Console > Logging > Logs Explorer
- Filter by Cloud Run service: todo-api

### What you should see

- One JSON log per request with latency and status.
- Errors use severity=ERROR so they are easy to filter.

## Secret Manager (TASKS_INTERNAL_TOKEN)

We use Secret Manager to store an internal token that Cloud Tasks sends to /tasks/remind.

### GCP setup (done via gcloud)

- Enable Secret Manager API
- Create secret: tasks-internal-token
- Grant Cloud Run service account: roles/secretmanager.secretAccessor
- Attach secret to Cloud Run as env var TASKS_INTERNAL_TOKEN

### App behavior

- Cloud Tasks includes header X-Internal-Token when scheduling reminders
- /tasks/remind rejects requests without the correct token

What changed in the code for this step:

- Cloud Tasks scheduler now injects X-Internal-Token
- /tasks/remind validates the token

## Cloud Run Job (cleanup completed todos)

We add a Cloud Run Job that deletes completed todos in batches. It reuses Firestore and runs separately from the HTTP API.

### GCP setup (done via gcloud)

- Enable Cloud Scheduler API (to run job on a schedule)
- Create Cloud Run Job: cleanup-completed
- Create service account: todo-scheduler
- Grant todo-scheduler: roles/run.invoker on the job
- Create Cloud Scheduler job that calls the Cloud Run Job run endpoint

### App config

- CLEANUP_LIMIT (default 100)

### How it works

- Scheduler triggers Cloud Run Job
- Job runs dist/jobs/cleanupCompleted.js
- Job queries Firestore for completed todos and deletes up to CLEANUP_LIMIT

## Cloud Build pipeline (CI/CD)

We use Cloud Build to build and deploy on every push. The pipeline builds a container, pushes to Artifact Registry, then deploys to Cloud Run.

### GCP setup (done via gcloud)

- Enable APIs: Cloud Build, Artifact Registry, Cloud Run
- Create Artifact Registry repo (Docker)
- Create Cloud Build trigger from GitHub
- Grant Cloud Build service account permissions:
  - roles/artifactregistry.writer
  - roles/run.admin
  - roles/iam.serviceAccountUser

### Files

- cloudbuild.yaml defines the build and deploy steps

### How it works

- GitHub push triggers Cloud Build
- Build produces image tagged with $SHORT_SHA
- Image is pushed to Artifact Registry
- Cloud Run deploys new revision with env vars and Secret Manager binding

## GCP setup (step-by-step)

### 1) Create project and enable APIs

- Create a new project in GCP Console.
- Enable APIs: Cloud Run, Firestore, Cloud Build, Artifact Registry.

### 2) Firestore

- In the Console, open Firestore and create a database in Native mode.
- Choose a region close to you.

### 3) IAM

- For Cloud Run, make sure the runtime service account has the role:
  - Cloud Datastore User

### 4) Authenticate locally (for Firestore)

Option A: ADC login (recommended)

  gcloud auth application-default login

Option B: Service account key

  - Create a service account with Cloud Datastore User role.
  - Download JSON key and set GOOGLE_APPLICATION_CREDENTIALS in .env.

### 5) Deploy to Cloud Run

From the project root:

  gcloud config set project YOUR_PROJECT_ID
  gcloud run deploy todo-api \
    --source . \
    --region YOUR_REGION \
    --allow-unauthenticated

Cloud Run will build and deploy the container. It listens on port 8080.

## Notes

- Set USE_IN_MEMORY=true in .env to run without Firestore.
- Firestore free tier includes 1 GB storage and generous reads/writes.
