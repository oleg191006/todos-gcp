import { Router, Request, Response } from "express";
import { TodoInput } from "../types/todo";
import { TodoService } from "../services/todoService";
import { PubSubPublisher } from "../services/pubSubPublisher";
import { CloudTasksScheduler } from "../services/cloudTasksScheduler";

export function createTodoRouter(
  service: TodoService,
  publisher?: PubSubPublisher | null,
  scheduler?: CloudTasksScheduler | null,
): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const todos = await service.list();
    res.json(todos);
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const todo = await service.getById(req.params.id);
    if (!todo) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }
    res.json(todo);
  });

  router.post("/", async (req: Request, res: Response) => {
    const input = req.body as TodoInput;
    if (!input.title || input.title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const todo = await service.create({
      title: input.title,
      completed: input.completed,
    });
    if (publisher) {
      try {
        await publisher.publishTodoCreated(todo);
      } catch (error) {
        console.error("Failed to publish todo.created", error);
      }
    }
    res.status(201).json(todo);
  });

  router.put("/:id", async (req: Request, res: Response) => {
    const input = req.body as TodoInput;
    if (input.title && input.title.trim().length === 0) {
      res.status(400).json({ error: "Title cannot be empty" });
      return;
    }
    const updated = await service.update(req.params.id, input);
    if (!updated) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }
    res.json(updated);
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const removed = await service.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/:id/remind", async (req: Request, res: Response) => {
    if (!scheduler) {
      res.status(501).json({ error: "Reminders not configured" });
      return;
    }
    const delaySeconds = Number(req.body?.delaySeconds ?? 0);
    if (!Number.isFinite(delaySeconds) || delaySeconds <= 0) {
      res.status(400).json({ error: "delaySeconds must be > 0" });
      return;
    }
    const todo = await service.getById(req.params.id);
    if (!todo) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }
    const taskName = await scheduler.scheduleReminder(
      { todoId: todo.id },
      delaySeconds,
    );
    res.status(202).json({ taskName });
  });

  return router;
}
