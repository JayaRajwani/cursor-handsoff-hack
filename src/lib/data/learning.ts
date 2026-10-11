/**
 * Reading a learner's enrolments, progress and certificates.
 * All queries run as the logged-in user, so Row Level Security applies.
 */
import "server-only";

import { getCourse, getCourseLessons, type Course } from "@/lib/content/courses";
import { createClient } from "@/lib/supabase/server";
import type { Certificate, Enrollment, Payment } from "@/lib/types";

export async function getEnrollment(userId: string, courseSlug: string): Promise<Enrollment | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select("*").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle();
  return (data as Enrollment | null) ?? null;
}

export async function getLatestPayment(userId: string, courseSlug: string): Promise<Payment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_slug", courseSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Payment | null) ?? null;
}

/** Set of completed lesson slugs for one course. */
export async function getCompletedLessons(userId: string, courseSlug: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("lesson_progress").select("lesson_slug").eq("user_id", userId).eq("course_slug", courseSlug);
  return new Set((data ?? []).map((row: { lesson_slug: string }) => row.lesson_slug));
}

/** Percentage of a course's lessons completed (0–100). Ignores lessons that were removed. */
export function progressPercent(course: Course, completed: Set<string>): number {
  const lessons = getCourseLessons(course);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => completed.has(l.slug)).length;
  return Math.round((done / lessons.length) * 100);
}

export type DashboardCourse = {
  course: Course;
  enrollment: Enrollment;
  percent: number;
  completedCount: number;
  /** Lesson to open when the learner clicks "Continue" */
  continueSlug: string | null;
  lastActivity: string | null;
  certificate: Certificate | null;
};

/** Everything the dashboard needs, in a few queries. */
export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const [enrollmentsRes, progressRes, activityRes, certsRes] = await Promise.all([
    supabase.from("enrollments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("lesson_progress").select("course_slug, lesson_slug").eq("user_id", userId),
    supabase.from("course_activity").select("course_slug, last_lesson_slug, updated_at").eq("user_id", userId),
    supabase.from("certificates").select("*").eq("user_id", userId),
  ]);

  const progressByCourse = new Map<string, Set<string>>();
  for (const row of (progressRes.data ?? []) as { course_slug: string; lesson_slug: string }[]) {
    if (!progressByCourse.has(row.course_slug)) progressByCourse.set(row.course_slug, new Set());
    progressByCourse.get(row.course_slug)!.add(row.lesson_slug);
  }
  const activity = new Map(
    ((activityRes.data ?? []) as { course_slug: string; last_lesson_slug: string; updated_at: string }[]).map((a) => [a.course_slug, a]),
  );
  const certificates = (certsRes.data ?? []) as Certificate[];

  const courses: DashboardCourse[] = [];
  for (const enrollment of (enrollmentsRes.data ?? []) as Enrollment[]) {
    const course = getCourse(enrollment.course_slug);
    if (!course) continue;
    const completed = progressByCourse.get(course.slug) ?? new Set<string>();
    const lessons = getCourseLessons(course);
    const last = activity.get(course.slug);
    const firstIncomplete = lessons.find((l) => !completed.has(l.slug));
    const lastExists = last && lessons.some((l) => l.slug === last.last_lesson_slug);
    courses.push({
      course,
      enrollment,
      percent: progressPercent(course, completed),
      completedCount: lessons.filter((l) => completed.has(l.slug)).length,
      continueSlug: (lastExists ? last.last_lesson_slug : null) ?? firstIncomplete?.slug ?? lessons[0]?.slug ?? null,
      lastActivity: last?.updated_at ?? null,
      certificate: certificates.find((c) => c.course_slug === course.slug) ?? null,
    });
  }

  // Most recently studied first
  courses.sort((a, b) => (b.lastActivity ?? b.enrollment.created_at).localeCompare(a.lastActivity ?? a.enrollment.created_at));
  return { courses, certificates };
}
