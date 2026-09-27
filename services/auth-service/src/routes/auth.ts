import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, ok, ConflictError, UnauthorizedError, NotFoundError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]).default("STUDENT"),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await db.user.create({
      data: { email: body.email, passwordHash, name: body.name, role: body.role },
    });

    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    ok(res, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 201);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    ok(res, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundError("User");
    ok(res, { user });
  } catch (err) {
    next(err);
  }
});

export default router;
