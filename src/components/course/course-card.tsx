import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpen, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CourseSummary } from "@/lib/content/courses";
import { cn } from "@/lib/utils";
import { PriceTag } from "./price-tag";

/** Course card used in the catalogue and on the home page. */
export function CourseCard({ course, className, priority }: { course: CourseSummary; className?: string; priority?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-teal hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-primary">
        <Image
          src={course.image}
          alt=""
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="bg-white/95">
            {course.tool}
          </Badge>
          {!course.published ? <Badge variant="warning">Coming soon</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-xl leading-snug font-semibold">
          <Link href={`/courses/${course.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {course.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{course.subtitle}</p>
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Course details">
          <li className="flex items-center gap-1">
            <BarChart3 className="size-3.5" aria-hidden="true" />
            {course.level}
          </li>
          <li className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {course.duration}
          </li>
          {course.published ? (
            <li className="flex items-center gap-1">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {course.lessonCount} lessons
            </li>
          ) : null}
        </ul>
        <div className="flex items-center justify-between border-t pt-3">
          {course.published ? (
            <PriceTag price={course.price} />
          ) : (
            <p className="text-sm font-medium text-warning">Expected {course.expectedLaunch ?? "soon"}</p>
          )}
          <span className="text-sm font-medium text-teal group-hover:underline" aria-hidden="true">
            {course.published ? "View course →" : "Learn more →"}
          </span>
        </div>
      </div>
    </article>
  );
}
