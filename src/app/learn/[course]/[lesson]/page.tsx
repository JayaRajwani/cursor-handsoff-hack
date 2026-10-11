/**
 * LESSON PLAYER
 * Lesson content is read and rendered ON THE SERVER, and only sent to the
 * browser if the visitor is allowed to see it (free preview, enrolled, or admin).
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Download, FileText, LayoutDashboard } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { PrivacyCallout } from "@/components/common/privacy-callout";
import { CompleteButton } from "@/components/learn/complete-button";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { MobileOutline } from "@/components/learn/mobile-outline";
import { Video } from "@/components/mdx/mdx-components";
import { MdxContent } from "@/components/mdx/mdx-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProfile, getUser } from "@/lib/auth";
import { getCourse, getLesson, readLessonSource } from "@/lib/content/courses";
import { getCompletedLessons, getEnrollment, progressPercent } from "@/lib/data/learning";
import { createMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

// Always check access on every request — never cache protected lessons.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const course = getCourse(courseSlug);
  const found = course ? getLesson(course, lessonSlug) : null;
  if (!course || !found) return {};
  return createMetadata({
    title: `${found.lesson.title} — ${course.title}`,
    description: found.lesson.description || course.subtitle,
    path: `/learn/${course.slug}/${found.lesson.slug}`,
    // Only free previews may appear in search results
    noIndex: !found.lesson.freePreview,
  });
}

export default async function LessonPage({ params }: Props) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const course = getCourse(courseSlug);
  if (!course) notFound();
  const found = getLesson(course, lessonSlug);
  if (!found) notFound();
  const { lesson, previous, next, index, total } = found;

  // ---------- Access check (server-side) ----------
  const user = await getUser();
  const [enrollment, profile] = user ? await Promise.all([getEnrollment(user.id, course.slug), getProfile()]) : [null, null];
  const isAdmin = profile?.role === "admin";
  const enrolled = enrollment?.status === "active";
  const hasAccess = enrolled || isAdmin;

  if (!course.published && !isAdmin) notFound();
  if (!lesson.freePreview && !hasAccess) {
    redirect(user ? `/enroll/${course.slug}` : `/login?next=${encodeURIComponent(`/learn/${course.slug}/${lesson.slug}`)}`);
  }

  // ---------- Progress ----------
  const completed = user && enrolled ? await getCompletedLessons(user.id, course.slug) : new Set<string>();
  const percent = progressPercent(course, completed);
  if (user && enrolled) {
    // Remember this lesson for "continue where you left off"
    const supabase = await createClient();
    await supabase
      .from("course_activity")
      .upsert(
        { user_id: user.id, course_slug: course.slug, last_lesson_slug: lesson.slug, updated_at: new Date().toISOString() },
        { onConflict: "user_id,course_slug" },
      );
  }

  const source = readLessonSource(lesson);
  const canNavigate = (l: typeof previous) => l && (hasAccess || l.freePreview);
  const sidebar = <LessonSidebar course={course} currentSlug={lesson.slug} completed={[...completed]} hasAccess={hasAccess} />;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <a href="#lesson-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
          Skip to lesson
        </a>
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/" aria-label="Home">
            <LogoMark className="size-8" />
          </Link>
          <MobileOutline title={course.title}>{sidebar}</MobileOutline>
          <Link href={`/courses/${course.slug}`} className="hidden min-w-0 truncate font-serif font-semibold text-primary hover:underline sm:block">
            {course.title}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {hasAccess && enrolled ? (
              <div className="hidden w-40 items-center gap-2 md:flex" aria-label={`Course progress: ${percent}%`}>
                <Progress value={percent} aria-hidden="true" />
                <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{percent}%</span>
              </div>
            ) : null}
            {user ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard aria-hidden="true" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/login?next=/learn/${course.slug}/${lesson.slug}`}>Log in</Link>
              </Button>
            )}
          </div>
        </div>
        {enrolled ? <Progress value={percent} className="h-1 rounded-none md:hidden" aria-label={`Course progress: ${percent}%`} /> : null}
      </header>

      <div className="flex flex-1">
        {/* ---------- Sidebar (desktop) ---------- */}
        <aside className="hidden w-80 shrink-0 border-r bg-muted/50 lg:block">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto p-4">{sidebar}</div>
        </aside>

        {/* ---------- Lesson ---------- */}
        <main id="lesson-content" className="min-w-0 flex-1">
          <article className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
            <p className="text-sm text-muted-foreground">
              {lesson.moduleTitle} · Lesson {index + 1} of {total} · {lesson.duration} min
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold sm:text-4xl">{lesson.title}</h1>
            {lesson.freePreview && !hasAccess ? (
              <Badge variant="teal" className="mt-3">
                Free preview
              </Badge>
            ) : null}

            {!course.published ? (
              <Alert variant="warning" className="mt-4">
                <AlertTitle>Draft course</AlertTitle>
                <AlertDescription>Only admins can see this course until it is published.</AlertDescription>
              </Alert>
            ) : null}

            <PrivacyCallout compact className="mt-6" />

            {lesson.video ? <Video src={lesson.video} title={lesson.title} /> : null}

            <MdxContent source={source} className="mt-8" />

            {lesson.resources.length > 0 ? (
              <section aria-labelledby="resources-heading" className="mt-10 rounded-xl border bg-card p-5">
                <h2 id="resources-heading" className="text-xl font-semibold">
                  Downloadable resources
                </h2>
                <ul className="mt-3 space-y-2">
                  {lesson.resources.map((r) => (
                    <li key={r.file}>
                      {hasAccess ? (
                        <a
                          href={`/api/resources/${course.slug}/${encodeURIComponent(r.file)}`}
                          className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
                          download
                        >
                          <Download className="size-4" aria-hidden="true" />
                          {r.title}
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="size-4" aria-hidden="true" />
                          {r.title} (available after enrolment)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* ---------- Complete + navigation ---------- */}
            <div className="mt-10 border-t pt-8">
              {enrolled ? (
                <CompleteButton
                  courseSlug={course.slug}
                  lessonSlug={lesson.slug}
                  initiallyComplete={completed.has(lesson.slug)}
                  nextHref={next ? `/learn/${course.slug}/${next.slug}` : null}
                />
              ) : !hasAccess ? (
                <div className="rounded-xl bg-primary p-6 text-white">
                  <p className="font-serif text-xl font-semibold text-white">Enjoying this lesson?</p>
                  <p className="mt-1 text-sm text-white/85">
                    Enrol to unlock all {total} lessons, track your progress and earn your certificate.
                  </p>
                  <Button asChild variant="teal" className="mt-4">
                    <Link href={`/enroll/${course.slug}`}>Enroll now</Link>
                  </Button>
                </div>
              ) : null}

              <nav aria-label="Lesson navigation" className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                {canNavigate(previous) && previous ? (
                  <Button asChild variant="outline">
                    <Link href={`/learn/${course.slug}/${previous.slug}`}>
                      <ArrowLeft aria-hidden="true" />
                      <span className="truncate">Previous: {previous.title}</span>
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {next ? (
                  canNavigate(next) ? (
                    <Button asChild>
                      <Link href={`/learn/${course.slug}/${next.slug}`}>
                        <span className="truncate">Next: {next.title}</span>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="teal">
                      <Link href={`/enroll/${course.slug}`}>Enrol to continue</Link>
                    </Button>
                  )
                ) : null}
              </nav>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
