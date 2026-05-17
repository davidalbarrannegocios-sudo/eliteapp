"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CourseTree } from "@/components/course-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  order: number;
  progress: Array<{ id: string; userId: string; lessonId: string }>;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  communityId: string;
  modules: Module[];
}

export default function CourseDetailPage({
  params,
}: {
  params: { id: string; courseId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  const isOwner = session?.user?.id === communityOwnerId;
  const isTeacher = session?.user?.role === "TEACHER";

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${params.courseId}`);
      if (!res.ok) return;
      setCourse(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [params.courseId]);

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
    fetchCourse();
    fetchCommunity();
  }, [fetchCourse, fetchCommunity]);

  useEffect(() => {
    // Auto-navigate to first lesson
    if (course && course.modules.length > 0) {
      const firstLesson = course.modules[0]?.lessons[0];
      if (firstLesson) {
        // Don't auto-redirect; show the overview
      }
    }
  }, [course]);

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const res = await fetch(`/api/courses/${params.courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to create module");
        return;
      }
      toast.success("Module created!");
      setNewModuleTitle("");
      setShowAddModule(false);
      fetchCourse();
    } catch {
      toast.error("Failed to create module");
    } finally {
      setAddingModule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30">
        Course not found
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div className="flex h-full">
      {/* Course Tree Sidebar */}
      <CourseTree
        communityId={params.id}
        courseId={params.courseId}
        modules={course.modules}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto p-8"
      >
        <div className="max-w-2xl">
          {/* Course header */}
          {course.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover rounded-2xl mb-6"
            />
          )}

          <h1 className="text-3xl font-extrabold mb-3">{course.title}</h1>
          {course.description && (
            <p className="text-white/50 text-lg leading-relaxed mb-6">
              {course.description}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm text-white/40 mb-8">
            <span>{course.modules.length} modules</span>
            <span>{totalLessons} lessons</span>
          </div>

          {/* Start button */}
          {firstLesson && (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white mb-8"
              onClick={() =>
                router.push(
                  `/community/${params.id}/courses/${params.courseId}/lessons/${firstLesson.id}`
                )
              }
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {totalLessons === 0 ? "No lessons yet" : "Start Course"}
            </Button>
          )}

          {/* Module list */}
          {course.modules.length === 0 ? (
            <div className="text-center py-10 text-white/20">
              <p>No modules yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {course.modules.map((mod, i) => (
                <div
                  key={mod.id}
                  className="bg-[#1A1D27] rounded-xl border border-white/5 p-4"
                >
                  <h3 className="font-semibold mb-2 text-sm text-white/70 uppercase tracking-wide">
                    Module {i + 1}: {mod.title}
                  </h3>
                  <div className="space-y-1">
                    {mod.lessons.map((lesson, j) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 text-sm text-white/50 py-1"
                      >
                        <span className="text-white/20 w-4 text-center">{j + 1}</span>
                        <span
                          className="cursor-pointer hover:text-white transition-colors"
                          onClick={() =>
                            router.push(
                              `/community/${params.id}/courses/${params.courseId}/lessons/${lesson.id}`
                            )
                          }
                        >
                          {lesson.title}
                        </span>
                        {lesson.progress.length > 0 && (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                      </div>
                    ))}
                    {mod.lessons.length === 0 && (
                      <p className="text-xs text-white/20 py-1">No lessons yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teacher: Add Module */}
          {isTeacher && isOwner && (
            <div className="mt-6">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowAddModule(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Module Dialog */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Module Title</Label>
              <Input
                placeholder="Introduction"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowAddModule(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleAddModule}
                disabled={!newModuleTitle.trim() || addingModule}
              >
                {addingModule ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
