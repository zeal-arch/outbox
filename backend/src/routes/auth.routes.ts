import { Router } from "express";
import { logout, getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

// Google OAuth itself happens client-side via Supabase Auth; the backend only
// verifies the resulting Supabase access token (see auth.middleware.ts).
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getMe);
