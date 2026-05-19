import { Todo, TodoInput } from "../types/todo";
import { TodoService } from "./todoService";

export class InMemoryTodoService implements TodoService {
  private items = new Map<string, Todo>();

  async list(): Promise<Todo[]> {
    return Array.from(this.items.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async getById(id: string): Promise<Todo | null> {
    return this.items.get(id) ?? null;
  }

  async create(input: TodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    const id = `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const todo: Todo = {
      id,
      title: input.title.trim(),
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now
    };
    this.items.set(id, todo);
    return todo;
  }

  async update(id: string, input: TodoInput): Promise<Todo | null> {
    const current = this.items.get(id);
    if (!current) {
      return null;
    }
    const updated: Todo = {
      ...current,
      title: input.title?.trim() ?? current.title,
      completed: input.completed ?? current.completed,
      updatedAt: new Date().toISOString()
    };
    this.items.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
