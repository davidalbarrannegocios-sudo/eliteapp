import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const community = await prisma.community.findUnique({
      where: { inviteCode: params.code },
      include: { _count: { select: { memberships: true } } },
    });

    if (!community) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    return NextResponse.json({
      id: community.id,
      name: community.name,
      description: community.description,
      coverImage: community.coverImage,
      color: community.color,
      memberCount: community._count.memberships,
    });
  } catch (error) {
    console.error("[JOIN_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const community = await prisma.community.findUnique({
      where: { inviteCode: params.code },
    });

    if (!community) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const existing = await prisma.membership.findUnique({
      where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member", communityId: community.id }, { status: 400 });
    }

    await prisma.membership.create({
      data: { userId: session.user.id, communityId: community.id },
    });

    return NextResponse.json({ success: true, communityId: community.id });
  } catch (error) {
    console.error("[JOIN_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
