import { Todo, TodoInput } from "../types/todo";

export interface TodoService {
  list(): Promise<Todo[]>;
  getById(id: string): Promise<Todo | null>;
  create(input: TodoInput): Promise<Todo>;
  update(id: string, input: TodoInput): Promise<Todo | null>;
  remove(id: string): Promise<boolean>;
}
