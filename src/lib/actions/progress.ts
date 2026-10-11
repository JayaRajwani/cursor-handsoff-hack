"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth";
import { issueCertificateIfComplete } from "@/lib/certificates";
import { getCourse, getLesson } from "@/lib/content/courses";
import { createClient } from "@/lib/supabase/server";

export type ProgressResult = { ok: boolean; completed?: boolean; certificateCode?: string; error?: string };

/** Mark a lesson complete (or not complete). RLS ensures the learner is enrolled. */
export async function setLessonComplete(courseSlug: string, lessonSlug: string, complete: boolean): Promise<ProgressResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please log in to save your progress." };

  const course = getCourse(courseSlug);
  if (!course || !getLesson(course, lessonSlug)) return { ok: false, error: "Lesson not found." };

  const supabase = await createClient();
  if (complete) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: user.id, course_slug: courseSlug, lesson_slug: lessonSlug }, { onConflict: "user_id,course_slug,lesson_slug", ignoreDuplicates: true });
    if (error) {
      console.error("[progress]", error.message);
      return { ok: false, error: "Could not save your progress. Are you enrolled in this course?" };
    }
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("course_slug", courseSlug).eq("lesson_slug", lessonSlug);
  }

  const certificate = complete ? await issueCertificateIfComplete(user.id, courseSlug) : null;

  revalidatePath(`/learn/${courseSlug}`, "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, completed: complete, certificateCode: certificate?.verification_code };
}
