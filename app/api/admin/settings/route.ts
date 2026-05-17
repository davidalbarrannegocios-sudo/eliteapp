import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TEACHER_CODE_KEY = "teacherInviteCode";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const setting = await prisma.setting.findUnique({ where: { key: TEACHER_CODE_KEY } });
  const code = setting?.value ?? process.env.TEACHER_INVITE_CODE ?? "1234";

  return NextResponse.json({ teacherInviteCode: code });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teacherInviteCode } = await req.json();
  if (!teacherInviteCode || typeof teacherInviteCode !== "string" || teacherInviteCode.trim().length < 4) {
    return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key: TEACHER_CODE_KEY },
    update: { value: teacherInviteCode.trim() },
    create: { key: TEACHER_CODE_KEY, value: teacherInviteCode.trim() },
  });

  return NextResponse.json({ success: true, teacherInviteCode: teacherInviteCode.trim() });
}
