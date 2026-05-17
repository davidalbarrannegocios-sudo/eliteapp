import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTeacherOrAdmin } from "@/lib/roles";
import { z } from "zod";

const createCommunitySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().default("#7C3AED"),
  isPrivate: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        community: {
          include: {
            _count: {
              select: { memberships: true, courses: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const communities = memberships.map((m) => ({
      ...m.community,
      memberCount: m.community._count.memberships,
      courseCount: m.community._count.courses,
    }));

    return NextResponse.json(communities);
  } catch (error) {
    console.error("[COMMUNITIES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTeacherOrAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only teachers can create communities" }, { status: 403 });
    }

    const body = await req.json();
    const data = createCommunitySchema.parse(body);

    const community = await prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        isPrivate: data.isPrivate,
        ownerId: session.user.id,
        channels: {
          create: [
            { name: "announcements", type: "ANNOUNCEMENT" },
            { name: "general", type: "TEXT" },
          ],
        },
        memberships: {
          create: { userId: session.user.id },
        },
      },
      include: {
        _count: { select: { memberships: true, courses: true } },
      },
    });

    return NextResponse.json({
      ...community,
      memberCount: community._count.memberships,
      courseCount: community._count.courses,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[COMMUNITIES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
