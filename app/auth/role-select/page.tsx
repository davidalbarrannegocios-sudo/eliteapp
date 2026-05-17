"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Loader2 } from "lucide-react";

const roleSchema = z
  .object({
    role: z.enum(["STUDENT", "TEACHER"]),
    teacherCode: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "TEACHER" && !data.teacherCode) return false;
      return true;
    },
    { message: "Teacher invite code is required", path: ["teacherCode"] }
  );

type RoleForm = z.infer<typeof roleSchema>;

export default function RoleSelectPage() {
  const router = useRouter();
  const { update } = useSession();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    mode: "onTouched",
    defaultValues: { role: "STUDENT" },
  });

  const role = watch("role");

  const onSubmit = async (data: RoleForm) => {
    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to set role");
        return;
      }

      await update({ role: data.role, needsRoleSelection: false });
      toast.success("Welcome to Elite App!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Elite App</span>
        </div>

        <div className="bg-[#1A1D27] rounded-2xl border border-white/5 p-8">
          <h1 className="text-2xl font-bold mb-1">One last step</h1>
          <p className="text-white/40 text-sm mb-8">
            Tell us how you&apos;ll be using Elite App
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label className="text-white/70 text-sm mb-3 block">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["STUDENT", "TEACHER"] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      role === r
                        ? "border-purple-500 bg-purple-600/20 text-white"
                        : "border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      value={r}
                      className="sr-only"
                      {...register("role")}
                    />
                    <span className="text-2xl">
                      {r === "STUDENT" ? "🎓" : "🏫"}
                    </span>
                    <span className="text-sm font-medium">
                      {r === "STUDENT" ? "Student" : "Teacher / Creator"}
                    </span>
                    <span className="text-xs text-center text-white/30">
                      {r === "STUDENT"
                        ? "Join communities & learn"
                        : "Build & manage communities"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {role === "TEACHER" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Label className="text-white/70 text-sm mb-1.5 block">
                  Teacher Invite Code
                </Label>
                <Input
                  placeholder="Enter your invite code"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
                  {...register("teacherCode")}
                />
                {errors.teacherCode && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.teacherCode.message}
                  </p>
                )}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Continue
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
