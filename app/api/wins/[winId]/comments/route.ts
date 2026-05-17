import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({ content: z.string().min(1).max(500) });

export async function GET(
  req: NextRequest,
  { params }: { params: { winId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const win = await prisma.win.findUnique({ where: { id: params.winId } });
    if (!win) {
      return NextResponse.json({ error: "Win not found" }, { status: 404 });
    }

    const comments = await prisma.winComment.findMany({
      where: { winId: params.winId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { winId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const win = await prisma.win.findUnique({ where: { id: params.winId } });
    if (!win) {
      return NextResponse.json({ error: "Win not found" }, { status: 404 });
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId: win.communityId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await req.json();
    const data = commentSchema.parse(body);

    const comment = await prisma.winComment.create({
      data: { content: data.content, winId: params.winId, userId: session.user.id },
    });

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[COMMENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
