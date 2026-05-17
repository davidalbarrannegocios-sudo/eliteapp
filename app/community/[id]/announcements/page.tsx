"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  userId: string;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null; role: string };
  replies: Array<{
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null; role: string };
  }>;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

export default function AnnouncementsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");

  const isTeacher = session?.user?.role === "TEACHER";

  const fetchChannel = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/channels`);
      if (!res.ok) return;
      const channels: Channel[] = await res.json();
      const ann = channels.find((c) => c.type === "ANNOUNCEMENT");
      setChannel(ann ?? null);
    } catch {}
  }, [params.id]);

  const fetchMessages = useCallback(async () => {
    if (!channel) return;
    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`);
      if (!res.ok) return;
      setMessages(await res.json());
    } catch {}
  }, [channel]);

  const fetchCommunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCommunityOwnerId(data.ownerId);
    } catch {}
  }, [params.id]);

  useEffect(() => {
    fetchChannel();
    fetchCommunity();
  }, [fetchChannel, fetchCommunity]);

  useEffect(() => {
    if (channel) {
      fetchMessages().finally(() => setLoading(false));
    }
  }, [channel, fetchMessages]);

  const handleSend = async (content: string) => {
    if (!channel) return;
    const res = await fetch(`/api/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      toast.error("Failed to send announcement");
      return;
    }
    fetchMessages();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Announcements</h1>
            <p className="text-xs text-white/30">
              {isTeacher ? "Post announcements to your community" : "Community announcements"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <MessageList
          messages={messages}
          channelId={channel?.id ?? ""}
          communityOwnerId={communityOwnerId}
          onRefresh={fetchMessages}
        />
      )}

      {/* Only teachers can post announcements */}
      {isTeacher && channel && (
        <MessageInput
          onSend={handleSend}
          placeholder="Write an announcement..."
        />
      )}
    </motion.div>
  );
}
