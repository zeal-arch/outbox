import { Router } from "express";
import multer from "multer";
import { listScheduledEmails, listSentEmails, scheduleEmail, getEmailById, listDrafts, saveDraft, deleteDraft, toggleStar, deleteEmailById } from "../controllers/email.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const emailRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

emailRouter.post("/schedule", requireAuth, upload.array("attachments"), scheduleEmail);
emailRouter.get("/drafts", requireAuth, listDrafts);
emailRouter.put("/drafts", requireAuth, saveDraft);
emailRouter.delete("/drafts/:id", requireAuth, deleteDraft);
emailRouter.get("/scheduled", requireAuth, listScheduledEmails);
emailRouter.get("/sent", requireAuth, listSentEmails);
emailRouter.get("/:id", requireAuth, getEmailById);
emailRouter.patch("/:id/star", requireAuth, toggleStar);
emailRouter.delete("/:id", requireAuth, deleteEmailById);
