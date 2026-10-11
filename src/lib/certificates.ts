/**
 * Certificates: issued automatically when a learner completes 100% of a course.
 * Uses the admin client so learners can never create certificates themselves.
 */
import "server-only";
import { randomInt } from "node:crypto";

import { getCourse, getCourseLessons } from "@/lib/content/courses";
import { sendEmail } from "@/lib/email/send";
import { certificateIssuedEmail } from "@/lib/email/templates";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import type { Certificate } from "@/lib/types";

// No 0/O/1/I to avoid confusion when typing the code
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. "MAI-7K3P-QX92-LM4D" */
export function generateVerificationCode(): string {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `MAI-${group()}-${group()}-${group()}`;
}

/**
 * Checks the learner's progress and issues a certificate if every lesson is complete.
 * Returns the certificate (new or existing) or null if not yet complete.
 */
export async function issueCertificateIfComplete(userId: string, courseSlug: string): Promise<Certificate | null> {
  const course = getCourse(courseSlug);
  if (!course || !course.certificate || !isAdminClientConfigured) return null;

  const admin = createAdminClient();

  const { data: existing } = await admin.from("certificates").select("*").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle();
  if (existing) return existing as Certificate;

  const [{ data: enrollment }, { data: progress }, { data: profile }] = await Promise.all([
    admin.from("enrollments").select("status").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle(),
    admin.from("lesson_progress").select("lesson_slug").eq("user_id", userId).eq("course_slug", courseSlug),
    admin.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);
  if (enrollment?.status !== "active") return null;

  const done = new Set((progress ?? []).map((p: { lesson_slug: string }) => p.lesson_slug));
  const lessons = getCourseLessons(course);
  if (lessons.length === 0 || !lessons.every((l) => done.has(l.slug))) return null;

  const recipientName = profile?.full_name?.trim() || profile?.email || "Learner";

  // Retry a few times in the (very unlikely) case of a duplicate code.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin
      .from("certificates")
      .insert({
        verification_code: generateVerificationCode(),
        user_id: userId,
        course_slug: courseSlug,
        recipient_name: recipientName,
        course_title: course.title,
      })
      .select("*")
      .single();
    if (data) {
      const cert = data as Certificate;
      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          ...certificateIssuedEmail({ name: recipientName, courseTitle: course.title, code: cert.verification_code }),
        });
      }
      return cert;
    }
    // 23505 = unique violation: either the code clashed, or another request just issued it.
    if (error?.code !== "23505") {
      console.error("[certificates] insert failed:", error?.message);
      return null;
    }
    const { data: raced } = await admin.from("certificates").select("*").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle();
    if (raced) return raced as Certificate;
  }
  return null;
}
