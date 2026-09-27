import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, paginate } from "@/lib/validation";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth();
  const { skip, take } = paginate(req.nextUrl.searchParams);
  const subject = req.nextUrl.searchParams.get("subject");
  const domain = req.nextUrl.searchParams.get("domain");

  const [nodes, total] = await Promise.all([
    db.competencyNode.findMany({
      where: {
        isActive: true,
        ...(subject ? { subject: subject as never } : {}),
        ...(domain ? { domain } : {}),
      },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
      skip,
      take,
      include: {
        prerequisites: { select: { id: true, title: true } },
        _count: { select: { questions: { where: { isActive: true } } } },
      },
    }),
    db.competencyNode.count({ where: { isActive: true } }),
  ]);

  return apiResponse({ nodes, total, skip, take });
});
