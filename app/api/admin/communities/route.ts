import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const communities = await prisma.community.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { memberships: true, courses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    communities.map((c) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.isPrivate,
      owner: c.owner,
      memberCount: c._count.memberships,
      courseCount: c._count.courses,
      createdAt: c.createdAt,
    }))
  );
}
