import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category") ?? "all";

    const session = await auth();

    const communities = await prisma.community.findMany({
      where: {
        isPrivate: false,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        owner: { select: { name: true, image: true } },
        _count: { select: { memberships: true, courses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach isMember flag if user is logged in
    let memberCommunityIds = new Set<string>();
    if (session?.user?.id) {
      const memberships = await prisma.membership.findMany({
        where: { userId: session.user.id },
        select: { communityId: true },
      });
      memberCommunityIds = new Set(memberships.map((m) => m.communityId));
    }

    const result = communities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverImage: c.coverImage,
      color: c.color,
      inviteCode: c.inviteCode,
      memberCount: c._count.memberships,
      courseCount: c._count.courses,
      owner: c.owner,
      isMember: memberCommunityIds.has(c.id),
    }));

    // Client-side category filter applied in UI; server just returns all public matches.
    // Category param is accepted for future server-side filtering.
    void category;

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DISCOVER_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
