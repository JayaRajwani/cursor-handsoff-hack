/**
 * Protected download of lesson resources (/content/courses/<slug>/resources/<file>).
 * Only enrolled learners (or admins) can download.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getProfile, getUser } from "@/lib/auth";
import { getCourse, getCourseLessons, getResourcePath } from "@/lib/content/courses";
import { getEnrollment } from "@/lib/data/learning";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".zip": "application/zip",
};

export async function GET(_request: Request, { params }: { params: Promise<{ course: string; file: string }> }) {
  const { course: courseSlug, file } = await params;
  const fileName = decodeURIComponent(file);
  const course = getCourse(courseSlug);
  if (!course) return new NextResponse("Not found", { status: 404 });

  // The file must be listed as a resource on one of the course's lessons.
  const listed = getCourseLessons(course).some((l) => l.resources.some((r) => r.file === fileName));
  const filePath = listed ? getResourcePath(course.slug, fileName) : null;
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  const user = await getUser();
  if (!user) return new NextResponse("Please log in to download this file.", { status: 401 });
  const [enrollment, profile] = await Promise.all([getEnrollment(user.id, course.slug), getProfile()]);
  if (enrollment?.status !== "active" && profile?.role !== "admin") {
    return new NextResponse("You need to be enrolled in this course to download this file.", { status: 403 });
  }

  const data = await fs.readFile(filePath);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
