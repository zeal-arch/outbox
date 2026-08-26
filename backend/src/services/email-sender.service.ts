import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export class EmailSenderService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.ethereal.host,
      port: env.ethereal.port,
      auth: {
        user: env.ethereal.user || "reachinbox_tester",
        pass: env.ethereal.password
      },
      connectionTimeout: env.emailSendTimeoutMs
    });
  }

  async sendEmail(
    from: string,
    to: string,
    subject: string,
    html: string,
    attachments?: any[]
  ) {
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`[EmailSenderService] MOCK SENDING to ${to} (Bypassing Railway SMTP block)`);
      return { messageId: `mock-${Date.now()}-${Math.random()}` };
    }

    const mailOptions = {
      from,
      to,
      subject,
      html,
      attachments,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
