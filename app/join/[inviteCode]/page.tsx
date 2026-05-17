"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface CommunityInfo {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  color: string;
  memberCount: number;
}

export default function JoinPage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await fetch(`/api/join/${params.inviteCode}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setCommunity(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [params.inviteCode]);

  const handleJoin = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/join/${params.inviteCode}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/join/${params.inviteCode}`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error === "Already a member") {
          setAlreadyMember(true);
          router.push(`/community/${json.communityId}`);
          return;
        }
        toast.error(json.error || "Failed to join");
        return;
      }

      toast.success(`Joined ${community?.name}!`);
      router.push(`/community/${json.communityId}`);
    } catch {
      toast.error("Failed to join community");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white">Elite App</span>
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      ) : notFound ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-white/40 mb-6">
            This invite code doesn&apos;t exist or has expired.
          </p>
          <Link href="/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-[#1A1D27] rounded-2xl border border-white/5 overflow-hidden">
            {/* Community color bar */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: community?.color }}
            />

            <div className="p-6">
              {/* Community Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4"
                style={{ backgroundColor: community?.color }}
              >
                {community?.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <h1 className="text-xl font-bold text-center mb-1">
                {community?.name}
              </h1>

              {community?.description && (
                <p className="text-white/50 text-sm text-center mb-4 leading-relaxed">
                  {community.description}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-white/40 mb-6">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{community?.memberCount} members</span>
                </div>
              </div>

              {alreadyMember ? (
                <div className="text-center">
                  <p className="text-green-400 text-sm mb-3">
                    You&apos;re already a member!
                  </p>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() =>
                      router.push(`/community/${community?.id}`)
                    }
                  >
                    Go to Community
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 font-semibold"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {status === "unauthenticated"
                      ? "Sign in to Join"
                      : "Join Community"}
                  </Button>
                  {status === "unauthenticated" && (
                    <p className="text-xs text-center text-white/30">
                      You&apos;ll be redirected to sign in first
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-white/30 mt-6">
            <Link href="/dashboard" className="hover:text-white/60 transition-colors">
              Back to dashboard
            </Link>
          </p>
        </motion.div>
      )}
    </div>
  );
}
