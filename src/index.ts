import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createTodoRouter } from "./routes/todos";
import { FirestoreTodoService } from "./services/firestoreTodoService";
import { InMemoryTodoService } from "./services/inMemoryTodoService";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { firebaseAuth } from "./middleware/firebaseAuth";
import { PubSubPublisher } from "./services/pubSubPublisher";
import { CloudTasksScheduler } from "./services/cloudTasksScheduler";
import { requestLogger } from "./middleware/requestLogger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8080;
const useInMemory = process.env.USE_IN_MEMORY === "true";
const authRequired = process.env.AUTH_REQUIRED === "true";
const pubSubTopic = process.env.PUBSUB_TOPIC;
const tasksProjectId = process.env.TASKS_PROJECT_ID;
const tasksLocation = process.env.TASKS_LOCATION;
const tasksQueue = process.env.TASKS_QUEUE;
const tasksTargetUrl = process.env.TASKS_TARGET_URL;
const tasksServiceAccount = process.env.TASKS_SERVICE_ACCOUNT_EMAIL;
const tasksRequireHeader = process.env.TASKS_REQUIRE_HEADER !== "false";
const tasksInternalToken = process.env.TASKS_INTERNAL_TOKEN;

const todoService = useInMemory
  ? new InMemoryTodoService()
  : new FirestoreTodoService();

const publisher = pubSubTopic ? new PubSubPublisher(pubSubTopic) : null;
const scheduler =
  tasksProjectId &&
  tasksLocation &&
  tasksQueue &&
  tasksTargetUrl &&
  tasksServiceAccount
    ? new CloudTasksScheduler({
        projectId: tasksProjectId,
        location: tasksLocation,
        queue: tasksQueue,
        targetUrl: tasksTargetUrl,
        serviceAccountEmail: tasksServiceAccount,
        internalToken: tasksInternalToken
      })
    : null;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (authRequired) {
  app.use("/todos", firebaseAuth);
}

app.use("/todos", createTodoRouter(todoService, publisher, scheduler));

app.post("/tasks/remind", (req, res) => {
  if (tasksRequireHeader && !req.header("X-CloudTasks-TaskName")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (tasksInternalToken) {
    const headerToken = req.header("X-Internal-Token");
    if (!headerToken || headerToken !== tasksInternalToken) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  const { todoId } = req.body as { todoId?: string };
  if (!todoId) {
    res.status(400).json({ error: "Missing todoId" });
    return;
  }
  console.log(`Reminder triggered for todo: ${todoId}`);
  res.status(200).json({ status: "reminder handled" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
