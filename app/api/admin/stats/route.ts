import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, communities, courses, messages] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.course.count(),
    prisma.message.count(),
  ]);

  return NextResponse.json({ users, communities, courses, messages });
}
