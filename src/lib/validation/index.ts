import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { toApiError } from "@/lib/errors";

export function apiResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}

export function withErrorHandler(
  handler: (req: NextRequest, ctx: unknown) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(
          error.errors.map((e) => e.message).join(", "),
          "VALIDATION_ERROR",
          422
        );
      }
      const { message, code, statusCode } = toApiError(error);
      return apiError(message, code, statusCode);
    }
  };
}

export function paginate(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}
