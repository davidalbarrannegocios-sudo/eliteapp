import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createModuleSchema = z.object({
  title: z.string().min(1),
  order: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create modules" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({ where: { id: params.courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({ where: { id: course.communityId } });
    if (community?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createModuleSchema.parse(body);

    const lastModule = await prisma.module.findFirst({
      where: { courseId: params.courseId },
      orderBy: { order: "desc" },
    });

    const newModule = await prisma.module.create({
      data: {
        title: data.title,
        courseId: params.courseId,
        order: data.order ?? (lastModule ? lastModule.order + 1 : 0),
      },
    });

    return NextResponse.json(newModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[MODULES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
