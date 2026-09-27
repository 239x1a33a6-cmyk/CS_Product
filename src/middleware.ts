import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

// Minimal NextAuth config for middleware — no DB calls, no bcrypt (not edge-safe)
const { auth } = NextAuth({
  providers: [Credentials({})],
  callbacks: {
    jwt({ token }) { return token; },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as { role?: string }).role ?? "STUDENT";

  // Role guards
  if (pathname.startsWith("/mentor") || pathname.startsWith("/admin")) {
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/competencies") ||
    pathname.startsWith("/assessments") ||
    pathname.startsWith("/progress")
  ) {
    if (role === "MENTOR" || role === "ADMIN") {
      return NextResponse.redirect(new URL("/mentor/cohort", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
