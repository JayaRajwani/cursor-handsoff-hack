import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";

import type { Course } from "@/lib/content/courses";
import { cn } from "@/lib/utils";

/** Course outline with checkmarks for completed lessons. */
export function LessonSidebar({
  course,
  currentSlug,
  completed,
  hasAccess,
}: {
  course: Course;
  currentSlug: string;
  completed: string[];
  hasAccess: boolean;
}) {
  const done = new Set(completed);
  return (
    <nav aria-label="Course lessons" className="space-y-6">
      {course.modules.map((mod, index) => (
        <div key={mod.folder}>
          <p className="px-2 text-xs font-semibold tracking-wide text-teal uppercase">Module {index + 1}</p>
          <p className="mt-0.5 px-2 font-serif font-semibold text-primary">{mod.title}</p>
          <ol className="mt-2 space-y-0.5">
            {mod.lessons.map((lesson) => {
              const current = lesson.slug === currentSlug;
              const isDone = done.has(lesson.slug);
              const locked = !hasAccess && !lesson.freePreview;
              const Icon = isDone ? CheckCircle2 : locked ? Lock : current ? PlayCircle : Circle;
              const content = (
                <>
                  <Icon
                    className={cn("mt-0.5 size-4 shrink-0", isDone ? "text-success" : locked ? "text-muted-foreground" : "text-teal")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {lesson.duration} min
                      {lesson.freePreview && !hasAccess ? " · Free preview" : ""}
                      {isDone ? <span className="sr-only"> · completed</span> : null}
                      {locked ? <span className="sr-only"> · locked</span> : null}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={lesson.slug}>
                  {locked ? (
                    <span className="flex gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground">{content}</span>
                  ) : (
                    <Link
                      href={`/learn/${course.slug}/${lesson.slug}`}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                        current ? "bg-teal-50 font-medium text-teal-strong" : "text-foreground",
                      )}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}
