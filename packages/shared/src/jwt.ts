import jwt from "jsonwebtoken";
import type { JwtPayload } from "./types";

const SECRET = process.env.AUTH_SECRET!;

export function signToken(payload: JwtPayload, expiresIn = "7d"): string {
  return jwt.sign(payload, SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
