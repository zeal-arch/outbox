import type { RequestHandler } from "express";
import { supabase } from "../config/supabase.js";
import { db } from "../config/database.js";
import crypto from "crypto";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
      return;
    }

    const email = user.email || "";
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email;
    
    // Ensure user exists in Postgres senders table
    const existingSender = await db.query(
      "SELECT id FROM senders WHERE email = $1",
      [email]
    );

    let senderId: string;
    if (existingSender.rows.length > 0) {
      senderId = existingSender.rows[0].id;
    } else {
      senderId = crypto.randomUUID();
      await db.query(
        "INSERT INTO senders (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
        [senderId, name, email]
      );
    }

    (req as any).user = {
      id: senderId,
      name,
      email,
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    };
    next();
  } catch (err) {
    console.error("[AuthMiddleware] Error verifying token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
