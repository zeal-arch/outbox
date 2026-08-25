import type { Request, Response } from "express";

// Actual authentication is handled client-side via Supabase Auth (Google OAuth),
// and verified server-side in middleware/auth.middleware.ts using supabase.auth.getUser().
// "Logout" is a client-side Supabase session clear; no server-side session store is used.

export function logout(_req: Request, res: Response) {
  res.json({ message: "Logged out successfully" });
}

export function getMe(req: Request, res: Response) {
  res.json({ user: (req as any).user });
}
