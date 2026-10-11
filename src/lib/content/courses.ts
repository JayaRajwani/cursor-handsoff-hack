/**
 * Course content loader.
 *
 * Courses live in /content/courses/<course-slug>/ :
 *   course.json                         → course details (title, price, modules…)
 *   <module-folder>/<nn>-<lesson>.mdx   → one file per lesson
 *   resources/<file>                    → downloadable files (enrolled learners only)
 *
 * This file reads those files from disk (on the server only) and checks them
 * with zod, so a typo in course.json produces a clear error message.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { cache } from "react";

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

/* ----------------------------- Schemas ----------------------------- */

export const HEALTHCARE_ROLES = {
  doctors: "Doctors",
  nurses: "Nurses",
  pharmacists: "Pharmacists",
  "allied-health": "Allied health",
  admin: "Admin & management",
  students: "Medical students",
} as const;
export type HealthcareRole = keyof typeof HEALTHCARE_ROLES;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const moduleSchema = z.object({
  /** Folder name inside the course folder, e.g. "01-getting-started" */
  folder: z.string(),
  title: z.string(),
  description: z.string().default(""),
});

const courseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  /** The AI tool the course teaches, e.g. "Claude" */
  tool: z.string(),
  level: z.enum(LEVELS),
  /** Human friendly total duration, e.g. "6 hours" */
  duration: z.string(),
  price: z.object({
    pkr: z.number().int().min(0),
    /** Optional fixed USD price. If omitted, an approximate value is calculated. */
    usd: z.number().min(0).optional(),
  }),
  /** Unpublished courses appear as "Coming soon" and cannot be bought. */
  published: z.boolean(),
  featured: z.boolean().default(false),
  /** Expected launch, shown for unpublished courses, e.g. "Early 2027" */
  expectedLaunch: z.string().optional(),
  /** Used by the catalogue filter. */
  roles: z.array(z.enum(Object.keys(HEALTHCARE_ROLES) as [HealthcareRole, ...HealthcareRole[]])),
  /** Who the course is for (bullet points). */
  audience: z.array(z.string()),
  /** What you will learn (bullet points). */
  outcomes: z.array(z.string()),
  prerequisites: z.array(z.string()).default([]),
  modules: z.array(moduleSchema).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  certificate: z.boolean().default(true),
  /** Card / hero illustration in /public, e.g. "/images/courses/claude-design.svg" */
  image: z.string(),
  keywords: z.array(z.string()).default([]),
  lastUpdated: z.string().optional(),
});

const resourceSchema = z.object({
  title: z.string(),
  /** File name inside the course's resources/ folder */
  file: z.string(),
});

const lessonFrontmatterSchema = z.object({
  title: z.string(),
  order: z.number(),
  /** Duration in minutes */
  duration: z.number().int().positive(),
  freePreview: z.boolean().default(false),
  description: z.string().default(""),
  /** Optional video URL (YouTube/Vimeo embed URL) shown above the lesson */
  video: z.string().url().optional(),
  resources: z.array(resourceSchema).default([]),
});

/* ------------------------------ Types ------------------------------ */

export type CourseJson = z.infer<typeof courseSchema>;

export type LessonMeta = z.infer<typeof lessonFrontmatterSchema> & {
  slug: string;
  courseSlug: string;
  moduleFolder: string;
  moduleTitle: string;
  /** Absolute file path (server only) */
  filePath: string;
};

export type CourseModule = z.infer<typeof moduleSchema> & {
  lessons: LessonMeta[];
  durationMinutes: number;
};

export type Course = Omit<CourseJson, "modules"> & {
  slug: string;
  modules: CourseModule[];
  lessonCount: number;
  durationMinutes: number;
};

/** A light, serialisable version of a course for client components (catalogue). */
export type CourseSummary = Pick<
  Course,
  | "slug"
  | "title"
  | "subtitle"
  | "tool"
  | "level"
  | "duration"
  | "price"
  | "published"
  | "roles"
  | "image"
  | "lessonCount"
  | "expectedLaunch"
  | "featured"
>;

/* ----------------------------- Loaders ----------------------------- */

function readLessons(courseSlug: string, mod: z.infer<typeof moduleSchema>): LessonMeta[] {
  const dir = path.join(COURSES_DIR, courseSlug, mod.folder);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const filePath = path.join(dir, file);
      const { data } = matter(fs.readFileSync(filePath, "utf8"));
      const parsed = lessonFrontmatterSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(`Invalid frontmatter in ${filePath}: ${parsed.error.message}`);
      }
      // "01-what-is-claude.mdx" → "what-is-claude"
      const slug = file.replace(/\.mdx$/, "").replace(/^\d+-/, "");
      return {
        ...parsed.data,
        slug,
        courseSlug,
        moduleFolder: mod.folder,
        moduleTitle: mod.title,
        filePath,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function loadCourse(slug: string): Course | null {
  const jsonPath = path.join(COURSES_DIR, slug, "course.json");
  if (!fs.existsSync(jsonPath)) return null;

  const parsed = courseSchema.safeParse(JSON.parse(fs.readFileSync(jsonPath, "utf8")));
  if (!parsed.success) {
    throw new Error(`Invalid course.json for "${slug}": ${parsed.error.message}`);
  }
  const data = parsed.data;

  const modules: CourseModule[] = data.modules.map((mod) => {
    const lessons = readLessons(slug, mod);
    return { ...mod, lessons, durationMinutes: lessons.reduce((sum, l) => sum + l.duration, 0) };
  });

  // Lesson slugs are used in URLs, so they must be unique within a course.
  const seen = new Set<string>();
  for (const lesson of modules.flatMap((m) => m.lessons)) {
    if (seen.has(lesson.slug)) {
      throw new Error(`Duplicate lesson slug "${lesson.slug}" in course "${slug}"`);
    }
    seen.add(lesson.slug);
  }

  return {
    ...data,
    slug,
    modules,
    lessonCount: modules.reduce((sum, m) => sum + m.lessons.length, 0),
    durationMinutes: modules.reduce((sum, m) => sum + m.durationMinutes, 0),
  };
}

/** All courses, published first, then by title. Cached per request. */
export const getAllCourses = cache((): Course[] => {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadCourse(entry.name))
    .filter((course): course is Course => course !== null)
    .sort((a, b) => Number(b.published) - Number(a.published) || Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
});

export const getCourse = cache((slug: string): Course | null => {
  return getAllCourses().find((course) => course.slug === slug) ?? null;
});

export function toCourseSummary(course: Course): CourseSummary {
  return {
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    tool: course.tool,
    level: course.level,
    duration: course.duration,
    price: course.price,
    published: course.published,
    roles: course.roles,
    image: course.image,
    lessonCount: course.lessonCount,
    expectedLaunch: course.expectedLaunch,
    featured: course.featured,
  };
}

/** Flat, ordered list of every lesson in a course. */
export function getCourseLessons(course: Course): LessonMeta[] {
  return course.modules.flatMap((mod) => mod.lessons);
}

export function getLesson(course: Course, lessonSlug: string) {
  const lessons = getCourseLessons(course);
  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) return null;
  return {
    lesson: lessons[index],
    previous: index > 0 ? lessons[index - 1] : null,
    next: index < lessons.length - 1 ? lessons[index + 1] : null,
    index,
    total: lessons.length,
  };
}

/** Read the raw MDX body of a lesson (without frontmatter). SERVER ONLY. */
export function readLessonSource(lesson: LessonMeta): string {
  const { content } = matter(fs.readFileSync(lesson.filePath, "utf8"));
  return content;
}

/** Absolute path of a downloadable resource, or null if it does not exist. */
export function getResourcePath(courseSlug: string, fileName: string): string | null {
  // Only allow plain file names (no "../" tricks).
  if (fileName !== path.basename(fileName)) return null;
  const filePath = path.join(COURSES_DIR, courseSlug, "resources", fileName);
  return fs.existsSync(filePath) ? filePath : null;
}
