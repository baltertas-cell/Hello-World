import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireSuperuser } from "../middlewares/auth";

const router: IRouter = Router();

// POST /users/me — JIT provisioning
router.post("/users/me", async (req, res): Promise<void> => {
  const { email, name, clerkId } = req.body as { email?: string; name?: string; clerkId?: string };

  if (!clerkId) {
    res.status(400).json({ error: "clerkId обовязковий" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) {
    const [updated] = await db
      .update(usersTable)
      .set({ email: email ?? existing.email, name: name ?? existing.name })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    res.json(updated);
    return;
  }

  const rows = await db.select().from(usersTable);
  const isFirst = rows.length === 0;
  const role = isFirst ? "superuser" : "user";

  if (!isFirst) {
    const superusers = await db.select().from(usersTable).where(eq(usersTable.role, "superuser"));
    if (superusers.length === 0) {
      res.status(403).json({ error: "Реєстрація тимчасово недоступна" });
      return;
    }
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkId, email: email ?? "", name: name ?? null, role, isActive: true })
    .returning();
  res.status(201).json(newUser);
});

// GET /users/me
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  res.json((req as any).user);
});

// GET /users
router.get("/users", requireSuperuser, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

// PATCH /users/:id
router.patch("/users/:id", requireSuperuser, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Невірний ID" }); return; }
  const { role, isActive } = req.body as { role?: string; isActive?: boolean };
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Користувача не знайдено" }); return; }
  res.json(user);
});

// DELETE /users/:id
router.delete("/users/:id", requireSuperuser, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Невірний ID" }); return; }
  const me = (req as any).user;
  if (me?.id === id) { res.status(400).json({ error: "Не можна видалити власний акаунт" }); return; }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Користувача не знайдено" }); return; }
  res.sendStatus(204);
});

export default router;
