import admin from "firebase-admin";
import { NextFunction, Request, Response } from "express";

let isInitialized = false;

function ensureInitialized(): void {
  if (!isInitialized) {
    admin.initializeApp();
    isInitialized = true;
  }
}

export async function firebaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    ensureInitialized();
    const decoded = await admin.auth().verifyIdToken(token);
    (req as { user?: unknown }).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
