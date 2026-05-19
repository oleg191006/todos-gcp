import { Firestore } from "@google-cloud/firestore";
import { Todo, TodoInput } from "../types/todo";
import { TodoService } from "./todoService";

export class FirestoreTodoService implements TodoService {
  private db: Firestore;
  private collectionName = "todos";

  constructor() {
    this.db = new Firestore();
  }

  async list(): Promise<Todo[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data() as Todo);
  }

  async getById(id: string): Promise<Todo | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    return doc.exists ? (doc.data() as Todo) : null;
  }

  async create(input: TodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    const docRef = this.db.collection(this.collectionName).doc();
    const todo: Todo = {
      id: docRef.id,
      title: input.title.trim(),
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now
    };
    await docRef.set(todo);
    return todo;
  }

  async update(id: string, input: TodoInput): Promise<Todo | null> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return null;
    }
    const current = existing.data() as Todo;
    const updated: Todo = {
      ...current,
      title: input.title?.trim() ?? current.title,
      completed: input.completed ?? current.completed,
      updatedAt: new Date().toISOString()
    };
    await docRef.set(updated, { merge: true });
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    await docRef.delete();
    return true;
  }
}
