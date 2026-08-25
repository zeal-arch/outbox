import { emailQueue } from "../queues/email.queue.js";
import type { ScheduleEmailInput } from "../types/email.js";

export class EmailSchedulerService {
  async scheduleEmail(input: ScheduleEmailInput) {
    const delay = Math.max(new Date(input.scheduledAt).getTime() - Date.now(), 0);

    return emailQueue.add(
      "send-email",
      {
        emailJobId: "replace-with-db-id",
        senderId: input.senderId
      },
      {
        delay,
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false
      }
    );
  }
}
