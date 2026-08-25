import type { Request, Response } from "express";

export function googleLogin(_req: Request, res: Response) {
  res.status(501).json({ message: "Google OAuth login is not implemented yet" });
}

export function googleCallback(_req: Request, res: Response) {
  res.status(501).json({ message: "Google OAuth callback is not implemented yet" });
}

export function logout(_req: Request, res: Response) {
  res.json({ message: "Logged out" });
}
