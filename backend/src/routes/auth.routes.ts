import { Router } from "express";
import { googleCallback, googleLogin, logout } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.get("/google", googleLogin);
authRouter.get("/google/callback", googleCallback);
authRouter.post("/logout", logout);
