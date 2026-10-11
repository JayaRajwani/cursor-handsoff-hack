import Link from "next/link";
import { Lock, PlayCircle } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/content/courses";
import { formatMinutes } from "@/lib/utils";

/** Full course syllabus: modules → lessons with durations and free previews. */
export function Syllabus({ course }: { course: Course }) {
  const hasLessons = course.lessonCount > 0;
  return (
    <Accordion type="multiple" defaultValue={course.modules[0] ? [course.modules[0].folder] : []} className="rounded-xl border bg-card px-4 sm:px-6">
      {course.modules.map((mod, index) => (
        <AccordionItem key={mod.folder} value={mod.folder}>
          <AccordionTrigger>
            <span className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-wide text-teal uppercase">Module {index + 1}</span>
              <span className="font-serif text-lg">{mod.title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {hasLessons ? `${mod.lessons.length} lessons · ${formatMinutes(mod.durationMinutes)}` : mod.description}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {mod.description && hasLessons ? <p className="mb-3">{mod.description}</p> : null}
            {mod.lessons.length > 0 ? (
              <ol className="divide-y rounded-lg border">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.slug} className="flex items-center justify-between gap-3 px-3 py-3">
                    <span className="flex min-w-0 items-start gap-2">
                      {lesson.freePreview ? (
                        <PlayCircle className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                      ) : (
                        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      {lesson.freePreview && course.published ? (
                        <Link href={`/learn/${course.slug}/${lesson.slug}`} className="font-medium text-foreground hover:text-teal hover:underline">
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="text-foreground">{lesson.title}</span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {lesson.freePreview ? <Badge variant="teal">Free preview</Badge> : <span className="sr-only">Enrolled learners only</span>}
                      {lesson.duration} min
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm">Detailed lessons will be published closer to launch.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
