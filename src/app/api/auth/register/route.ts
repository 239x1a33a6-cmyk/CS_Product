import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db/client";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { ConflictError } from "@/lib/errors";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["STUDENT", "MENTOR"]).default("STUDENT"),
  inviteCode: z.string().optional(), // future: restrict mentor registration
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = registerSchema.parse(body);

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      studentProfile:
        data.role === "STUDENT" ? { create: {} } : undefined,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return apiResponse({ user }, 201);
});
