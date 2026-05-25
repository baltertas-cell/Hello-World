import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Не авторизовано" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    res.status(403).json({ error: "Доступ заборонено. Зверніться до адміністратора." });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ error: "Ваш акаунт деактивовано." });
    return;
  }

  (req as any).user = user;
  next();
}

export async function requireSuperuser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Не авторизовано" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user || user.role !== "superuser") {
    res.status(403).json({ error: "Потрібні права суперкористувача" });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ error: "Ваш акаунт деактивовано." });
    return;
  }

  (req as any).user = user;
  next();
}
