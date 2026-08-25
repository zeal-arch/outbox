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

  async sendEmail(from: string, to: string, subject: string, html: string, attachments?: nodemailer.SendMailOptions['attachments']) {
    return this.transporter.sendMail({
      from,
      to,
      subject,
      html, // Send as HTML
      attachments
    });
  }
}

