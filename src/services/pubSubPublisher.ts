import { PubSub, Topic } from "@google-cloud/pubsub";
import { Todo } from "../types/todo";

export class PubSubPublisher {
  private topic: Topic;

  constructor(topicName: string) {
    const pubsub = new PubSub();
    this.topic = pubsub.topic(topicName);
  }

  async publishTodoCreated(todo: Todo): Promise<void> {
    await this.topic.publishMessage({
      json: todo,
      attributes: {
        event: "todo.created",
      },
    });
  }
}
