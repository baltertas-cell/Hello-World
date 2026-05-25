import type { Request, Response, NextFunction } from "express";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  next(); // тимчасово без авторизації
}

export async function requireSuperuser(req: Request, res: Response, next: NextFunction): Promise<void> {
  next(); // тимчасово без авторизації
}
