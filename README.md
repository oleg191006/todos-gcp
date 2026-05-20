# GCP Todo API (Express + TypeScript)

A compact backend project designed for hands-on GCP practice. It exposes a todo REST API, deploys to Cloud Run, stores data in Firestore, publishes events to Pub/Sub, schedules reminders with Cloud Tasks, uses Secret Manager for internal auth, and includes a cleanup Cloud Run Job. A simple static frontend is included for quick manual testing.

## What is inside

- Express + TypeScript REST API (CRUD for todos)
- Firestore for storage
- Cloud Run deployment (container)
- Pub/Sub events on todo creation
- Cloud Tasks reminders (/tasks/remind)
- Secret Manager token for internal callbacks
- Cloud Run Job for cleanup
- Cloud Build CI/CD pipeline
- Static frontend hosted on Cloud Storage

## Architecture

Browser -> Cloud Run API -> Firestore

Cloud Run API -> Pub/Sub (todo.created)
Cloud Run API -> Cloud Tasks -> /tasks/remind
Cloud Scheduler -> Cloud Run Job -> Firestore cleanup
Cloud Build -> Artifact Registry -> Cloud Run
Cloud Storage -> static frontend

## Quick start (local)

1. Install dependencies

   npm install

2. Copy env example

   Copy .env.example to .env and adjust if needed.

3. Run dev server

   npm run dev

API is available at http://localhost:8080

## Endpoints

- GET /health
- GET /todos
- GET /todos/:id
- POST /todos { title, completed? }
- PUT /todos/:id { title?, completed? }
- DELETE /todos/:id
- POST /todos/:id/remind { delaySeconds }
- POST /tasks/remind (Cloud Tasks only)

## Environment variables

See [.env.example](.env.example). Key variables:

- PORT
- USE_IN_MEMORY
- AUTH_REQUIRED
- PUBSUB_TOPIC
- TASKS_PROJECT_ID
- TASKS_LOCATION
- TASKS_QUEUE
- TASKS_TARGET_URL
- TASKS_SERVICE_ACCOUNT_EMAIL
- TASKS_REQUIRE_HEADER
- TASKS_INTERNAL_TOKEN (Secret Manager)
- CLEANUP_LIMIT

## Deploy to Cloud Run

From project root:

gcloud config set project YOUR_PROJECT_ID
gcloud run deploy todo-api \
 --source . \
 --region YOUR_REGION \
 --allow-unauthenticated

## Frontend (static)

Frontend files are in frontend/. Host them on Cloud Storage to test the API from a browser.

## Full GCP flow

See the detailed explanation with commands and service interactions in [docs/GCP_FLOW.md](docs/GCP_FLOW.md).
