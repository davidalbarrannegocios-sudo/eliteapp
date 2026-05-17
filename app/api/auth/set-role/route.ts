import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const setRoleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
  teacherCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = setRoleSchema.parse(body);

    if (data.role === "TEACHER") {
      const inviteCode = process.env.TEACHER_INVITE_CODE;
      if (!data.teacherCode || data.teacherCode !== inviteCode) {
        return NextResponse.json(
          { error: "Invalid teacher invite code" },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: data.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }
    console.error("[SET_ROLE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
