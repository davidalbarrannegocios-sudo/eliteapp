import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: { channel: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({
      where: { id: message.channel.communityId },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Only owner/teacher can pin
    if (community.ownerId !== session.user.id && session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.message.update({
      where: { id: params.messageId },
      data: { isPinned: body.isPinned ?? !message.isPinned },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MESSAGE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { channelId: string; messageId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: { channel: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const community = await prisma.community.findUnique({
      where: { id: message.channel.communityId },
    });

    const isOwner = community?.ownerId === session.user.id;
    const isAuthor = message.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER";

    if (!isAuthor && !isOwner && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id: params.messageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MESSAGE_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
