import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { supervisionRelations } from "@/storage/database/shared/schema";
import { authenticateRequest, unauthorizedResponse } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;

    await db
      .update(supervisionRelations)
      .set({ active: false })
      .where(
        and(eq(supervisionRelations.id, id), eq(supervisionRelations.adminUserId, auth.user.id)),
      );

    return NextResponse.json({ success: true, message: "已解除监督" });
  } catch (error) {
    return handleApiError(error, "解除监督");
  }
}
