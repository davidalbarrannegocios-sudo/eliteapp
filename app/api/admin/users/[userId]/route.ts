import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent self-demotion
  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 });
  }

  const body = await req.json();
  const { role, isBanned } = body;

  const validRoles = ["STUDENT", "TEACHER", "ADMIN"];
  if (role !== undefined && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...(role !== undefined && { role }),
      ...(isBanned !== undefined && { isBanned }),
    },
    select: { id: true, name: true, email: true, role: true, isBanned: true },
  });

  return NextResponse.json(updated);
}
