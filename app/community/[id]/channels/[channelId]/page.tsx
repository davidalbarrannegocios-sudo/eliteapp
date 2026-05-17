"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { Hash, Loader2 } from "lucide-react";
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
  communityId: string;
}

export default function ChannelPage({
  params,
}: {
  params: { id: string; channelId: string };
}) {
  useSession();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    userName: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchChannel = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/channels`);
      if (!res.ok) return;
      const channels: Channel[] = await res.json();
      const ch = channels.find((c) => c.id === params.channelId);
      setChannel(ch ?? null);
    } catch {}
  }, [params.id, params.channelId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${params.channelId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {}
  }, [params.channelId]);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll every 3 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  const handleSend = async (content: string, parentId?: string) => {
    const res = await fetch(`/api/channels/${params.channelId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast.error(j.error || "Failed to send message");
      return;
    }
    setReplyTo(null);
    await fetchMessages();
  };

  const handleReply = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      setReplyTo({
        id: msg.id,
        content: msg.content,
        userName: msg.user.name ?? "Unknown",
      });
    }
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
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Hash className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <h1 className="font-bold text-lg">
              {channel ? `#${channel.name}` : "Loading..."}
            </h1>
            <p className="text-xs text-white/30">Text channel</p>
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
          channelId={params.channelId}
          communityOwnerId={communityOwnerId}
          onReply={handleReply}
          onRefresh={fetchMessages}
        />
      )}

      <div ref={bottomRef} />

      {/* Message Input */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        placeholder={`Message #${channel?.name ?? "channel"}`}
      />
    </motion.div>
  );
}
