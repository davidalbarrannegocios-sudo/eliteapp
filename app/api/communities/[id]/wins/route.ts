import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWinSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId: params.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const wins = await prisma.win.findMany({
      where: { communityId: params.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        reactions: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wins);
  } catch (error) {
    console.error("[WINS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId: params.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await req.json();
    const data = createWinSchema.parse(body);

    const win = await prisma.win.create({
      data: {
        title: data.title,
        description: data.description,
        image: data.image || null,
        userId: session.user.id,
        communityId: params.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(win);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[WINS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
