"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WinCard } from "@/components/win-card";
import { Trophy, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function WinsPage({ params }: { params: { id: string } }) {
  useSession();
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image: "" });

  const fetchWins = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/wins`);
      if (res.ok) setWins(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchWins();
  }, [fetchWins]);

  const handlePost = async () => {
    if (!form.title.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/communities/${params.id}/wins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to post win");
        return;
      }
      toast.success("Win posted!");
      setForm({ title: "", description: "", image: "" });
      setShowPost(false);
      fetchWins();
    } catch {
      toast.error("Failed to post win");
    } finally {
      setPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="font-bold text-lg">Wins</h1>
        </div>
        <Button
          onClick={() => setShowPost(true)}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post a Win
        </Button>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : wins.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2">No wins yet</p>
            <p className="text-sm">Be the first to share a win!</p>
            <Button
              onClick={() => setShowPost(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              Share a Win
            </Button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="space-y-5"
          >
            {wins.map((win) => (
              <motion.div key={win.id} variants={fadeUp}>
                <WinCard win={win} onUpdate={fetchWins} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Post Win Dialog */}
      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Share a Win
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Title</Label>
              <Input
                placeholder="I just shipped my first feature!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Description (optional)
              </Label>
              <Textarea
                placeholder="Tell us more about your win..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Image URL (optional)
              </Label>
              <Input
                placeholder="https://example.com/screenshot.png"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowPost(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handlePost}
                disabled={!form.title.trim() || posting}
              >
                {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Share Win 🎉
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
