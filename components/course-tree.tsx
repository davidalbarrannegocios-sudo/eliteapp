"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  progress: LessonProgress[];
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseTreeProps {
  communityId: string;
  courseId: string;
  modules: Module[];
}

export function CourseTree({ communityId, courseId, modules }: CourseTreeProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.progress.length > 0).length,
    0
  );
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="w-72 bg-[#111318] border-r border-white/5 flex flex-col h-full overflow-hidden shrink-0">
      {/* Progress header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/60">Progress</span>
          <span className="text-white font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/30 mt-1.5">
          {completedLessons} / {totalLessons} lessons
        </p>
      </div>

      {/* Module/Lesson tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {modules.map((module) => {
          const isCollapsed = collapsed.has(module.id);
          const completedInModule = module.lessons.filter(
            (l) => l.progress.length > 0
          ).length;

          return (
            <div key={module.id} className="mb-1">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider truncate">
                    {module.title}
                  </p>
                  <p className="text-xs text-white/25 mt-0.5">
                    {completedInModule}/{module.lessons.length}
                  </p>
                </div>
              </button>

              {!isCollapsed && (
                <div className="ml-4 border-l border-white/5 pl-3 space-y-0.5 pb-2">
                  {module.lessons.map((lesson) => {
                    const isCompleted = lesson.progress.length > 0;
                    const lessonPath = `/community/${communityId}/courses/${courseId}/lessons/${lesson.id}`;
                    const isActive = pathname === lessonPath;

                    return (
                      <Link
                        key={lesson.id}
                        href={lessonPath}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-purple-600/20 text-purple-300"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0 text-white/20" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
