import { CloudTasksClient } from "@google-cloud/tasks";

export interface ReminderPayload {
  todoId: string;
}

export class CloudTasksScheduler {
  private client: CloudTasksClient;
  private projectId: string;
  private location: string;
  private queue: string;
  private targetUrl: string;
  private serviceAccountEmail: string;
  private internalToken?: string;

  constructor(options: {
    projectId: string;
    location: string;
    queue: string;
    targetUrl: string;
    serviceAccountEmail: string;
    internalToken?: string;
  }) {
    this.client = new CloudTasksClient();
    this.projectId = options.projectId;
    this.location = options.location;
    this.queue = options.queue;
    this.targetUrl = options.targetUrl;
    this.serviceAccountEmail = options.serviceAccountEmail;
    this.internalToken = options.internalToken;
  }

  async scheduleReminder(
    payload: ReminderPayload,
    delaySeconds: number,
  ): Promise<string> {
    const parent = this.client.queuePath(
      this.projectId,
      this.location,
      this.queue,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.internalToken) {
      headers["X-Internal-Token"] = this.internalToken;
    }

    const task = {
      httpRequest: {
        httpMethod: "POST" as const,
        url: this.targetUrl,
        headers,
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
        oidcToken: {
          serviceAccountEmail: this.serviceAccountEmail,
        },
      },
      scheduleTime: {
        seconds: Math.floor(Date.now() / 1000) + delaySeconds,
      },
    };

    const [response] = await this.client.createTask({ parent, task });
    return response.name ?? "";
  }
}
