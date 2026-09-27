import { auth } from "./config";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session as AuthSession;
}

export async function requireRole(
  ...roles: string[]
): Promise<AuthSession> {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError(`Role ${roles.join(" or ")} required`);
  }
  return session;
}

export async function requireStudent() {
  return requireRole("STUDENT");
}

export async function requireMentor() {
  return requireRole("MENTOR", "ADMIN");
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
