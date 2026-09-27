import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: { message: err.errors.map((e) => e.message).join(", "), code: "VALIDATION_ERROR" },
    });
  }
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: { message: err.message, code: err.code } });
  }
  console.error(err);
  return res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL" } });
}
