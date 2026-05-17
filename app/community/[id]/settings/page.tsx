"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Loader2, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const settingsSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  color: z.string(),
  isPrivate: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface Community {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  color: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerId: string;
}

export default function CommunitySettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

  const isPrivate = watch("isPrivate");
  const color = watch("color");

  const fetchCommunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}`);
      if (!res.ok) {
        router.replace("/dashboard");
        return;
      }
      const data: Community = await res.json();

      if (data.ownerId !== session?.user?.id) {
        router.replace(`/community/${params.id}`);
        return;
      }

      setCommunity(data);
      reset({
        name: data.name,
        description: data.description ?? "",
        coverImage: data.coverImage ?? "",
        color: data.color,
        isPrivate: data.isPrivate,
      });
    } catch {} finally {
      setLoading(false);
    }
  }, [params.id, session, router, reset]);

  useEffect(() => {
    if (session?.user?.id) fetchCommunity();
  }, [fetchCommunity, session]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      const res = await fetch(`/api/communities/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to update settings");
        return;
      }
      toast.success("Settings saved!");
      fetchCommunity();
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${community?.name}"? This action cannot be undone.`)) return;
    if (!confirm("Are you absolutely sure? All data will be lost.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Community deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete community");
    } finally {
      setDeleting(false);
    }
  };

  const copyInviteCode = () => {
    if (!community) return;
    navigator.clipboard.writeText(community.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite code copied!");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white/60" />
          </div>
          <h1 className="font-bold text-lg">Community Settings</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl space-y-8">
        {/* Invite Code */}
        <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-5">
          <h2 className="font-semibold mb-1">Invite Code</h2>
          <p className="text-sm text-white/40 mb-4">
            Share this code so people can join your community.
          </p>
          <div className="flex gap-3 items-center">
            <code className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-purple-300">
              {community?.inviteCode}
            </code>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 bg-transparent shrink-0"
              onClick={copyInviteCode}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#1A1D27] rounded-2xl border border-white/5 p-5 space-y-5">
          <h2 className="font-semibold">General</h2>

          <div>
            <Label className="text-white/70 text-sm mb-1.5 block">Name</Label>
            <Input
              className="bg-white/5 border-white/10 text-white focus:border-purple-500"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-1.5 block">
              Description
            </Label>
            <Textarea
              className="bg-white/5 border-white/10 text-white focus:border-purple-500 resize-none"
              rows={3}
              {...register("description")}
            />
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-1.5 block">
              Cover Image URL
            </Label>
            <Input
              placeholder="https://example.com/cover.jpg"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              {...register("coverImage")}
            />
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color ?? "#7C3AED"}
                onChange={(e) => setValue("color", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-white/10"
              />
              <span className="text-sm text-white/40">{color}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/70 text-sm">Private Community</Label>
              <p className="text-xs text-white/30 mt-0.5">
                Only members with invite link can join
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={(v) => setValue("isPrivate", v)}
              className="data-checked:!bg-purple-600"
            />
          </div>

          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-950/20 rounded-2xl border border-red-500/20 p-5">
          <h2 className="font-semibold text-red-400 mb-1">Danger Zone</h2>
          <p className="text-sm text-white/40 mb-4">
            Permanently delete this community and all its data. This cannot be
            undone.
          </p>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Community
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
