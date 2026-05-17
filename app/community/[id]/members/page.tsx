"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Member {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function MembersPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const isOwner = session?.user?.id === communityOwnerId;

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/members`);
      if (res.ok) setMembers(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchCommunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityOwnerId(data.ownerId);
      }
    } catch {}
  }, [params.id]);

  useEffect(() => {
    fetchMembers();
    fetchCommunity();
  }, [fetchMembers, fetchCommunity]);

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the community?`)) return;
    setRemoving(userId);
    try {
      const res = await fetch(`/api/communities/${params.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to remove member");
        return;
      }
      toast.success(`${userName} removed`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Members</h1>
            <p className="text-xs text-white/30">{members.length} members</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="space-y-2"
          >
            {members.map((member) => (
              <motion.div
                key={member.id}
                variants={fadeUp}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1D27] border border-white/5"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.user.image ?? ""} />
                  <AvatarFallback className="bg-purple-600/50 text-white text-sm">
                    {member.user.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {member.user.name ?? "Unknown"}
                    </p>
                    {member.user.id === communityOwnerId && (
                      <Badge className="bg-amber-600/20 text-amber-400 border-0 text-xs py-0">
                        Owner
                      </Badge>
                    )}
                    <Badge
                      className={`border-0 text-xs py-0 ${
                        member.user.role === "TEACHER"
                          ? "bg-purple-600/20 text-purple-300"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {member.user.role === "TEACHER" ? "Teacher" : "Student"}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">
                    Joined{" "}
                    {formatDistanceToNow(new Date(member.joinedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {isOwner && member.user.id !== communityOwnerId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0"
                    onClick={() =>
                      handleRemove(member.user.id, member.user.name ?? "member")
                    }
                    disabled={removing === member.user.id}
                  >
                    {removing === member.user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
