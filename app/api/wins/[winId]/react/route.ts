import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const existing = await prisma.reaction.findUnique({
      where: { userId_winId_emoji: { userId: session.user.id, winId: params.winId, emoji } },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed" });
    } else {
      const reaction = await prisma.reaction.create({
        data: { emoji, userId: session.user.id, winId: params.winId },
      });
      return NextResponse.json({ action: "added", reaction });
    }
  } catch (error) {
    console.error("[REACT_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
