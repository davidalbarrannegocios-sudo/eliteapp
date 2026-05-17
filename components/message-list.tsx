"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  userId: string;
  isPinned: boolean;
  createdAt: string;
  user: MessageUser;
  replies: Array<{
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user: MessageUser;
  }>;
}

interface MessageListProps {
  messages: Message[];
  channelId: string;
  communityOwnerId: string;
  onReply?: (messageId: string) => void;
  onRefresh?: () => void;
}

export function MessageList({
  messages,
  channelId,
  communityOwnerId,
  onReply,
  onRefresh,
}: MessageListProps) {
  const { data: session } = useSession();
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const isTeacher = session?.user?.role === "TEACHER";
  const isOwner = session?.user?.id === communityOwnerId;

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const regularMessages = messages;

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePin = async (message: Message) => {
    try {
      const res = await fetch(
        `/api/channels/${channelId}/messages/${message.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !message.isPinned }),
        }
      );

      if (!res.ok) throw new Error();
      toast.success(message.isPinned ? "Message unpinned" : "Message pinned");
      onRefresh?.();
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const res = await fetch(
        `/api/channels/${channelId}/messages/${messageId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Message deleted");
      onRefresh?.();
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const MessageItem = ({
    message,
    isReply = false,
  }: {
    message: Message | Message["replies"][0];
    isReply?: boolean;
  }) => {
    const canPin = (isTeacher || isOwner) && !isReply;
    const canDelete =
      message.userId === session?.user?.id || isTeacher || isOwner;
    const isFullMessage = "isPinned" in message;

    return (
      <div
        className={cn(
          "group flex items-start gap-3 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition-colors",
          isReply && "pl-14 opacity-80"
        )}
      >
        <Avatar className="w-8 h-8 mt-0.5 shrink-0">
          <AvatarImage src={message.user.image ?? ""} />
          <AvatarFallback className="bg-purple-600/50 text-white text-xs">
            {message.user.name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">
              {message.user.name}
            </span>
            {message.user.role === "TEACHER" && (
              <Badge className="bg-purple-600/30 text-purple-300 text-[10px] py-0 h-4 border-0">
                Teacher
              </Badge>
            )}
            {isFullMessage && message.isPinned && (
              <Badge className="bg-amber-600/30 text-amber-300 text-[10px] py-0 h-4 border-0">
                <Pin className="w-2.5 h-2.5 mr-1" />
                Pinned
              </Badge>
            )}
            <span className="text-xs text-white/30">{formatDate(message.createdAt)}</span>
          </div>
          <p className="text-sm text-white/80 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!isReply && onReply && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/10"
              onClick={() => onReply((message as Message).id)}
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </Button>
          )}
          {canPin && isFullMessage && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0 hover:bg-white/10",
                message.isPinned ? "text-amber-400 hover:text-amber-300" : "text-white/30 hover:text-white"
              )}
              onClick={() => handlePin(message as Message)}
              title={message.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="w-3.5 h-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-white/30 hover:text-red-400 hover:bg-white/10"
              onClick={() => handleDelete(message.id)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-amber-600/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pinned Messages
            </span>
          </div>
          <div className="space-y-1">
            {pinnedMessages.map((msg) => (
              <p key={msg.id} className="text-sm text-white/60 truncate">
                <span className="text-white/40 mr-1">{msg.user.name}:</span>
                {msg.content}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* All Messages */}
      <div className="py-4 space-y-0.5">
        {regularMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          regularMessages.map((message) => (
            <div key={message.id}>
              <MessageItem message={message} />
              {message.replies.length > 0 && (
                <div className="pl-14 pr-4 pb-1">
                  <button
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                    onClick={() => toggleReplies(message.id)}
                  >
                    {expandedReplies.has(message.id) ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {message.replies.length} repl{message.replies.length > 1 ? "ies" : "y"}
                  </button>
                  {expandedReplies.has(message.id) && (
                    <div className="mt-1 space-y-0.5">
                      {message.replies.map((reply) => (
                        <MessageItem key={reply.id} message={reply} isReply />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
