import { Router } from "express";
import { listScheduledEmails, listSentEmails, scheduleEmail } from "../controllers/email.controller.js";

export const emailRouter = Router();

emailRouter.post("/schedule", scheduleEmail);
emailRouter.get("/scheduled", listScheduledEmails);
emailRouter.get("/sent", listSentEmails);
