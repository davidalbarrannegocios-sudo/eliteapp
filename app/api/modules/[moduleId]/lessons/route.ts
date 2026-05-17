import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createLessonSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  order: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create lessons" }, { status: 403 });
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id: params.moduleId },
      include: { course: true },
    });

    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({
      where: { id: moduleRecord.course.communityId },
    });

    if (community?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    const body = await req.json();
    const data = createLessonSchema.parse(body);

    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId: params.moduleId },
      orderBy: { order: "desc" },
    });

    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        content: data.content,
        videoUrl: data.videoUrl,
        moduleId: params.moduleId,
        order: data.order ?? (lastLesson ? lastLesson.order + 1 : 0),
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[LESSONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
