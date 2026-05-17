"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CoursesPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", thumbnail: "" });

  const isOwner = session?.user?.id === communityOwnerId;
  const isTeacher = session?.user?.role === "TEACHER";

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${params.id}/courses`);
      if (res.ok) setCourses(await res.json());
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
    fetchCourses();
    fetchCommunity();
  }, [fetchCourses, fetchCommunity]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/communities/${params.id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to create course");
        return;
      }
      const course = await res.json();
      setCourses((prev) => [{ ...course, progress: 0, totalLessons: 0, completedLessons: 0 }, ...prev]);
      toast.success("Course created!");
      setForm({ title: "", description: "", thumbnail: "" });
      setShowCreate(false);
    } catch {
      toast.error("Failed to create course");
    } finally {
      setCreating(false);
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
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="font-bold text-lg">Courses</h1>
        </div>
        {isTeacher && isOwner && (
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No courses yet</p>
            {isTeacher && isOwner && (
              <Button
                onClick={() => setShowCreate(true)}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Create First Course
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {courses.map((course) => (
              <motion.div key={course.id} variants={fadeUp}>
                <Link href={`/community/${params.id}/courses/${course.id}`}>
                  <div className="group bg-[#1A1D27] rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all overflow-hidden cursor-pointer">
                    {/* Thumbnail */}
                    <div className="h-36 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 relative overflow-hidden">
                      {course.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-white/10" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-base mb-1 truncate">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-white/40 mb-3 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/40">
                          <span>{course.totalLessons} lessons</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 bg-white/10" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Course Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Title</Label>
              <Input
                placeholder="JavaScript Fundamentals"
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
                placeholder="What will students learn?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Thumbnail URL (optional)
              </Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
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
                disabled={!form.title.trim() || creating}
              >
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
