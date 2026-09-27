import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";

// List users by role — used by admin UIs for dropdowns
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const role = req.nextUrl.searchParams.get("role");

  const users = await db.user.findMany({
    where: {
      isActive: true,
      ...(role && { role: role as never }),
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return apiResponse({ users });
});
