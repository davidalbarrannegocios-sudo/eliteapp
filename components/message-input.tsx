"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Bold, Italic } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string, parentId?: string) => Promise<void>;
  replyTo?: { id: string; content: string; userName: string } | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  placeholder = "Send a message...",
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await onSend(content.trim(), replyTo?.id);
      setContent("");
      onCancelReply?.();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertFormat = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 0);
  };

  return (
    <div className="border-t border-white/5 p-4">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg bg-purple-600/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-400 text-xs font-medium">Replying to</span>
            <span className="text-white font-medium text-xs">{replyTo.userName}</span>
            <span className="text-white/40 text-xs truncate max-w-[200px]">
              {replyTo.content}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-white/30 hover:text-white"
            onClick={onCancelReply}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Format toolbar */}
      <div className="flex items-center gap-1 mb-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/5"
          onClick={() => insertFormat("**", "**")}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/5"
          onClick={() => insertFormat("_", "_")}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/25",
            "focus:border-purple-500 min-h-[44px] max-h-[160px] overflow-y-auto",
            "py-2.5 px-3 text-sm"
          )}
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 160) + "px";
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          className="bg-purple-600 hover:bg-purple-700 text-white h-11 w-11 p-0 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-white/20 mt-1.5">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
