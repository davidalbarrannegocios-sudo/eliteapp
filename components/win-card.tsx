"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WinUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  winId: string;
}

interface Win {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  user: WinUser;
  reactions: Reaction[];
  _count: { comments: number };
}

interface WinCardProps {
  win: Win;
  onUpdate: () => void;
}

const EMOJIS = ["🔥", "💪", "🎉", "👏", "⚡"];

export function WinCard({ win, onUpdate }: WinCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<
    Array<{ id: string; content: string; userId: string; createdAt: string }>
  >([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const reactionsByEmoji = EMOJIS.map((emoji) => {
    const reactionsForEmoji = win.reactions.filter((r) => r.emoji === emoji);
    const hasReacted = reactionsForEmoji.some((r) => r.userId === session?.user?.id);
    return { emoji, count: reactionsForEmoji.length, hasReacted };
  });

  const handleReact = async (emoji: string) => {
    try {
      const res = await fetch(`/api/wins/${win.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
    } catch {
      toast.error("Failed to react");
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/wins/${win.id}/comments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/wins/${win.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      onUpdate();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="bg-[#1A1D27] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={win.user.image ?? ""} />
          <AvatarFallback className="bg-purple-600/50 text-white text-sm">
            {win.user.name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{win.user.name}</p>
          <p className="text-xs text-white/30">
            {formatDistanceToNow(new Date(win.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-lg mb-1">{win.title}</h3>
        {win.description && (
          <p className="text-white/60 text-sm leading-relaxed">{win.description}</p>
        )}
      </div>

      {/* Image */}
      {win.image && (
        <div className="px-4 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={win.image}
            alt="Win"
            className="rounded-xl w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        {reactionsByEmoji.map(({ emoji, count, hasReacted }) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all",
              hasReacted
                ? "bg-purple-600/20 border-purple-500/40 text-white"
                : count > 0
                ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                : "bg-transparent border-transparent text-white/20 hover:text-white/60 hover:bg-white/5 hover:border-white/10"
            )}
          >
            {emoji}
            {count > 0 && <span className="text-xs font-medium">{count}</span>}
          </button>
        ))}
      </div>

      {/* Comments button */}
      <div className="px-4 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {win._count.comments} comment{win._count.comments !== 1 ? "s" : ""}
        </button>

        {showComments && (
          <div className="mt-3 space-y-3">
            {loadingComments ? (
              <p className="text-xs text-white/30">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-white/30">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="text-sm text-white/60">
                  <span className="text-white/80 font-medium mr-1">User</span>
                  {comment.content}
                </div>
              ))
            )}

            {/* Add comment */}
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9"
              />
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 h-9 w-9 p-0"
                onClick={handleComment}
                disabled={!newComment.trim() || submittingComment}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
