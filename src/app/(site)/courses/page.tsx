import { PageHeader } from "@/components/common/page-header";
import { CourseCatalog } from "@/components/course/course-catalog";
import { HEALTHCARE_ROLES, LEVELS, getAllCourses, toCourseSummary } from "@/lib/content/courses";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "AI courses for healthcare professionals",
  description:
    "Browse practical, safety-first AI courses for doctors, nurses, pharmacists, allied health and hospital staff. Filter by AI tool, level and healthcare role.",
  path: "/courses",
});

export default function CoursesPage() {
  const courses = getAllCourses().map(toCourseSummary);
  return (
    <>
      <PageHeader
        title="Courses"
        description="Practical AI courses for healthcare professionals. Each course focuses on one area of healthcare work and one AI tool."
        breadcrumbs={[{ name: "Courses", href: "/courses" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CourseCatalog courses={courses} roles={HEALTHCARE_ROLES} levels={LEVELS} />
      </div>
    </>
  );
}
