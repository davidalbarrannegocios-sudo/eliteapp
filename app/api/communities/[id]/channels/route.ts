import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createChannelSchema = z.object({
  name: z.string().min(1).max(32),
  type: z.enum(["TEXT", "ANNOUNCEMENT"]).default("TEXT"),
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

    const channels = await prisma.channel.findMany({
      where: { communityId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("[CHANNELS_GET]", error);
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

    const community = await prisma.community.findUnique({ where: { id: params.id } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createChannelSchema.parse(body);

    const channel = await prisma.channel.create({
      data: {
        name: data.name.toLowerCase().replace(/\s+/g, "-"),
        type: data.type,
        communityId: params.id,
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[CHANNELS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
