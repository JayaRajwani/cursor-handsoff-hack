/**
 * Social sharing image for a course, at a stable URL: /og/course/<slug>
 * Pre-built at deploy time (static).
 */
import { getAllCourses, getCourse } from "@/lib/content/courses";
import { renderOgImage } from "@/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCourses().map((course) => ({ slug: course.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  return renderOgImage({
    eyebrow: course ? `${course.tool} · ${course.level}${course.published ? "" : " · Coming soon"}` : "Course",
    title: course?.title ?? "Course",
    subtitle: course?.subtitle,
  });
}
