"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CourseTree } from "@/components/course-tree";
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
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  progress: LessonProgress[];
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
  communityId: string;
  modules: Module[];
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export default function LessonPage({
  params,
}: {
  params: { id: string; courseId: string; lessonId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityOwnerId, setCommunityOwnerId] = useState("");
  const [toggling, setToggling] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    videoUrl: "",
    moduleId: "",
  });

  const isOwner = session?.user?.id === communityOwnerId;
  const isTeacher = session?.user?.role === "TEACHER";

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${params.courseId}`);
      if (!res.ok) return;
      const data: Course = await res.json();
      setCourse(data);

      // Find current lesson
      for (const mod of data.modules) {
        const found = mod.lessons.find((l) => l.id === params.lessonId);
        if (found) {
          setLesson(found);
          break;
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [params.courseId, params.lessonId]);

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

  // Get flat list of all lessons for navigation
  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === params.lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = lesson?.progress && lesson.progress.length > 0;

  const toggleComplete = async () => {
    if (!lesson) return;
    setToggling(true);
    try {
      const method = isCompleted ? "DELETE" : "POST";
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, { method });
      if (!res.ok) throw new Error();
      toast.success(isCompleted ? "Marked incomplete" : "Lesson complete!");
      fetchCourse();
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setToggling(false);
    }
  };

  const handleAddLesson = async () => {
    if (!lessonForm.title.trim() || !lessonForm.moduleId) return;
    setAddingLesson(true);
    try {
      const res = await fetch(`/api/modules/${lessonForm.moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonForm.title,
          content: lessonForm.content || undefined,
          videoUrl: lessonForm.videoUrl || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Failed to add lesson");
        return;
      }
      toast.success("Lesson added!");
      setLessonForm({ title: "", content: "", videoUrl: "", moduleId: "" });
      setShowAddLesson(false);
      fetchCourse();
    } catch {
      toast.error("Failed to add lesson");
    } finally {
      setAddingLesson(false);
    }
  };

  const navigate = (lessonId: string) => {
    router.push(
      `/community/${params.id}/courses/${params.courseId}/lessons/${lessonId}`
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const embedUrl = lesson?.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;

  return (
    <div className="flex h-full">
      {/* Course tree sidebar */}
      {course && (
        <CourseTree
          communityId={params.id}
          courseId={params.courseId}
          modules={course.modules}
        />
      )}

      {/* Lesson content */}
      <motion.div
        key={params.lessonId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Lesson title + complete button */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-extrabold leading-tight">
              {lesson?.title ?? "Lesson"}
            </h1>
            <Button
              onClick={toggleComplete}
              disabled={toggling}
              variant="outline"
              className={`shrink-0 border-white/10 transition-all ${
                isCompleted
                  ? "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5 bg-transparent"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <Circle className="w-4 h-4 mr-2" />
              )}
              {isCompleted ? "Completed" : "Mark Complete"}
            </Button>
          </div>

          {/* Video */}
          {lesson?.videoUrl && embedUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden bg-black aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
          {lesson?.videoUrl && !embedUrl && (
            <div className="mb-6">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full rounded-2xl bg-black"
              />
            </div>
          )}

          {/* Content */}
          {lesson?.content && (
            <div
              className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          )}

          {!lesson?.content && !lesson?.videoUrl && (
            <div className="text-white/30 text-center py-10">
              <p>No content for this lesson yet.</p>
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 bg-transparent"
              disabled={!prevLesson}
              onClick={() => prevLesson && navigate(prevLesson.id)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {nextLesson ? (
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => navigate(nextLesson.id)}
              >
                Next Lesson
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  router.push(`/community/${params.id}/courses/${params.courseId}`)
                }
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finish Course
              </Button>
            )}
          </div>

          {/* Teacher: Add lesson */}
          {isTeacher && isOwner && course && (
            <div className="mt-6">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowAddLesson(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson to Module
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Lesson Dialog */}
      <Dialog open={showAddLesson} onOpenChange={setShowAddLesson}>
        <DialogContent className="bg-[#1A1D27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Module</Label>
              <select
                value={lessonForm.moduleId}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, moduleId: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Select module...</option>
                {course?.modules.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#1A1D27]">
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Title</Label>
              <Input
                placeholder="Lesson title"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Video URL (optional)
              </Label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={lessonForm.videoUrl}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">
                Content (optional, HTML supported)
              </Label>
              <Textarea
                placeholder="Lesson content..."
                value={lessonForm.content}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, content: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5 bg-transparent"
                onClick={() => setShowAddLesson(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleAddLesson}
                disabled={
                  !lessonForm.title.trim() ||
                  !lessonForm.moduleId ||
                  addingLesson
                }
              >
                {addingLesson ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Add Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
