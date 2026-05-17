"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  color: z.string(),
  isPrivate: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const PRESET_COLORS = [
  "#7C3AED",
  "#4F46E5",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#7C3AED",
];

export interface CommunityResult {
  id: string;
  name: string;
  description: string | null;
  color: string;
  memberCount: number;
  courseCount: number;
  inviteCode: string;
}

interface CreateCommunityDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (community: CommunityResult) => void;
}

export function CreateCommunityDialog({
  open,
  onClose,
  onCreated,
}: CreateCommunityDialogProps) {
  const [selectedColor, setSelectedColor] = useState("#7C3AED");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: "#7C3AED", isPrivate: false },
  });

  const isPrivate = watch("isPrivate");

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create community");
        return;
      }
      toast.success(`${json.name} created!`);
      onCreated(json as CommunityResult);
      reset();
      setSelectedColor("#7C3AED");
      onClose();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1D27] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Community</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div>
            <Label className="text-white/70 text-sm mb-1.5 block">Name</Label>
            <Input
              placeholder="My Awesome Community"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-1.5 block">Description (optional)</Label>
            <Input
              placeholder="What is this community about?"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              {...register("description")}
            />
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-3 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color, i) => (
                <button
                  key={`${color}-${i}`}
                  type="button"
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "white" : "transparent",
                  }}
                  onClick={() => {
                    setSelectedColor(color);
                    setValue("color", color);
                  }}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setValue("color", e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-white/10"
                title="Custom color"
              />
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

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
