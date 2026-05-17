import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommunitySidebar } from "@/components/community-sidebar";

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const community = await prisma.community.findUnique({
    where: { id: params.id },
  });

  if (!community) {
    redirect("/dashboard");
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_communityId: {
        userId: session.user.id,
        communityId: params.id,
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-[#0F1117] overflow-hidden">
      <CommunitySidebar
        community={{
          id: community.id,
          name: community.name,
          color: community.color,
          ownerId: community.ownerId,
        }}
      />
      <main className="flex-1 ml-64 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
