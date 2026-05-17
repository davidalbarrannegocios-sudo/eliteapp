"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Hash, Plus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export default function ChannelsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);
  const [communityOwnerId, setCommunityOwnerId] = useState("");

  const isOwner = session?.user?.id === communityOwnerId;

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/channels`);
      if (res.ok) setChannels(await res.json());
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
    fetchChannels();
    fetchCommunity();
  }, [fetchChannels, fetchCommunity]);

  const handleCreate = async () => {
    if (!newChannelName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/communities/${params.id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName.trim(), type: "TEXT" }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to create channel");
        return;
      }
      const channel = await res.json();
      setChannels((prev) => [...prev, channel]);
      toast.success(`#${channel.name} created!`);
      setNewChannelName("");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setCreating(false);
    }
  };

  const textChannels = channels.filter((c) => c.type === "TEXT");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <h1 className="font-bold text-lg">Channels</h1>
        </div>
        {isOwner && (
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Channel
          </Button>
        )}
      </div>

      <div className="p-6 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : textChannels.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No channels yet</p>
            {isOwner && (
              <Button
                onClick={() => setShowCreate(true)}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Create First Channel
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {textChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/community/${params.id}/channels/${channel.id}`}
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1A1D27] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold"># {channel.name}</p>
                    <p className="text-sm text-white/30">Text channel</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Channel Name
              </Label>
              <Input
                placeholder="general"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleCreate}
                disabled={!newChannelName.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
