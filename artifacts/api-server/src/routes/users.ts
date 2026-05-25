import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireSuperuser } from "../middlewares/auth";

const router: IRouter = Router();

// POST /users/me — JIT provisioning: called after login to register/fetch current user
router.post("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Не авторизовано" });
    return;
  }

  const { email, name } = req.body as { email?: string; name?: string };

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) {
    // Update name/email if changed
    const [updated] = await db
      .update(usersTable)
      .set({ email: email ?? existing.email, name: name ?? existing.name })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    res.json(updated);
    return;
  }

  // Check if this is the very first user — make them superuser
  const [{ count }] = await db.execute<{ count: string }>(
    db.select({ count: db.$count(usersTable) }).toSQL() as any,
  ).catch(async () => {
    const rows = await db.select().from(usersTable);
    return [{ count: String(rows.length) }];
  });

  const isFirst = parseInt(String(count), 10) === 0;
  const role = isFirst ? "superuser" : "user";

  // New user — but only allow if superuser exists or it's the first user
  if (!isFirst) {
    // Check if there's at least one superuser — if not, block
    const superusers = await db.select().from(usersTable).where(eq(usersTable.role, "superuser"));
    if (superusers.length === 0) {
      res.status(403).json({ error: "Реєстрація тимчасово недоступна" });
      return;
    }
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkId,
      email: email ?? "",
      name: name ?? null,
      role,
      isActive: true,
    })
    .returning();

  res.status(201).json(newUser);
});

// GET /users/me — get current user profile
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  res.json((req as any).user);
});

// GET /users — list all users (superuser only)
router.get("/users", requireSuperuser, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

// PATCH /users/:id — update role or active status (superuser only)
router.patch("/users/:id", requireSuperuser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Невірний ID" });
    return;
  }

  const { role, isActive } = req.body as { role?: string; isActive?: boolean };
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "Користувача не знайдено" });
    return;
  }
  res.json(user);
});

// DELETE /users/:id — remove user (superuser only, cannot delete self)
router.delete("/users/:id", requireSuperuser, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Невірний ID" });
    return;
  }

  const me = (req as any).user;
  if (me.id === id) {
    res.status(400).json({ error: "Не можна видалити власний акаунт" });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "Користувача не знайдено" });
    return;
  }
  res.sendStatus(204);
});

export default router;
