import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { verifyToken } from "@cs-platform/shared";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true }));

// Public routes — no JWT check
const PUBLIC: Array<{ method: string; path: RegExp }> = [
  { method: "POST", path: /^\/api\/auth\/(login|register)$/ },
];

function isPublic(method: string, path: string) {
  return PUBLIC.some((r) => r.method === method && r.path.test(path));
}

// JWT auth middleware
app.use((req, res, next) => {
  if (isPublic(req.method, req.path)) return next();
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.headers["x-user-id"] = payload.sub;
    req.headers["x-user-role"] = payload.role;
    req.headers["x-user-email"] = payload.email;
    req.headers["x-user-name"] = payload.name;
    next();
  } catch {
    return res.status(401).json({ error: { message: "Invalid token", code: "UNAUTHORIZED" } });
  }
});

const SERVICES: Record<string, string> = {
  "/api/auth": process.env.AUTH_SERVICE_URL ?? "http://localhost:4001",
  "/api/users": process.env.USER_SERVICE_URL ?? "http://localhost:4002",
  "/api/admin/cohorts": process.env.USER_SERVICE_URL ?? "http://localhost:4002",
  "/api/admin/competencies": process.env.CONTENT_SERVICE_URL ?? "http://localhost:4003",
  "/api/admin/questions": process.env.CONTENT_SERVICE_URL ?? "http://localhost:4003",
  "/api/assessments": process.env.ASSESSMENT_SERVICE_URL ?? "http://localhost:4004",
  "/api/attempts": process.env.ASSESSMENT_SERVICE_URL ?? "http://localhost:4004",
  "/api/admin/scripts": process.env.INTERVIEW_SERVICE_URL ?? "http://localhost:4005",
  "/api/interviews": process.env.INTERVIEW_SERVICE_URL ?? "http://localhost:4005",
  "/api/mastery": process.env.MASTERY_SERVICE_URL ?? "http://localhost:4006",
  "/api/mentor": process.env.MASTERY_SERVICE_URL ?? "http://localhost:4006",
};

// Register proxy routes (longest prefix first)
const prefixes = Object.keys(SERVICES).sort((a, b) => b.length - a.length);
for (const prefix of prefixes) {
  app.use(
    prefix,
    createProxyMiddleware({
      target: SERVICES[prefix],
      changeOrigin: true,
    })
  );
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`api-gateway running on :${PORT}`));
