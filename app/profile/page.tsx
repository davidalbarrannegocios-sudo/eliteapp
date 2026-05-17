"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      image: session?.user?.image ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to update profile");
        return;
      }
      await update({ name: data.name, image: data.image });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to update password");
        return;
      }
      toast.success("Password updated!");
      resetPassword();
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      {/* Nav */}
      <div className="border-b border-white/5 px-6 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Profile header */}
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20">
              <AvatarImage src={session.user?.image ?? ""} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {session.user?.name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{session.user?.name}</h1>
              <p className="text-white/40 text-sm">{session.user?.email}</p>
              <Badge
                className={`mt-2 border-0 ${
                  session.user?.role === "TEACHER"
                    ? "bg-purple-600/20 text-purple-300"
                    : "bg-white/5 text-white/50"
                }`}
              >
                {session.user?.role === "TEACHER" ? "Teacher" : "Student"}
              </Badge>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-6">
            <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Edit Profile
            </h2>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Name</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                  {...registerProfile("name")}
                />
                {profileErrors.name && (
                  <p className="text-red-400 text-xs mt-1">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">
                  Avatar URL
                </Label>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
                  {...registerProfile("image")}
                />
              </div>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Profile
              </Button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-6">
            <h2 className="font-semibold text-lg mb-1">Change Password</h2>
            <p className="text-sm text-white/40 mb-5">
              Only available for accounts with email/password login.
            </p>
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">
                  Current Password
                </Label>
                <Input
                  type="password"
                  className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">
                  New Password
                </Label>
                <Input
                  type="password"
                  className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">
                  Confirm New Password
                </Label>
                <Input
                  type="password"
                  className="bg-white/5 border-white/10 text-white focus:border-purple-500"
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
