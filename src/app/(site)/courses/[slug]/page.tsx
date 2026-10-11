import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award, BarChart3, BookOpen, CheckCircle2, Clock, Infinity as InfinityIcon, PlayCircle, Smartphone, UserRound } from "lucide-react";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { PrivacyCallout } from "@/components/common/privacy-callout";
import { NetworkPattern } from "@/components/illustrations/patterns";
import { PriceTag } from "@/components/course/price-tag";
import { Syllabus } from "@/components/course/syllabus";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { HEALTHCARE_ROLES, getAllCourses, getCourse, getCourseLessons } from "@/lib/content/courses";
import { courseJsonLd, createMetadata, faqJsonLd } from "@/lib/seo";
import { formatMinutes } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

/** Pre-build a static page for every course. */
export function generateStaticParams() {
  return getAllCourses().map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return createMetadata({
    title: course.published ? course.title : `${course.title} (coming soon)`,
    description: course.subtitle,
    path: `/courses/${course.slug}`,
    image: `/og/course/${course.slug}`,
    keywords: course.keywords,
  });
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const previews = getCourseLessons(course).filter((l) => l.freePreview);
  const jsonLd: Record<string, unknown>[] = [courseJsonLd(course)];
  if (course.faqs.length) jsonLd.push(faqJsonLd(course.faqs));

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ---------- Course hero ---------- */}
      <section className="relative overflow-hidden bg-primary text-white">
        <NetworkPattern className="text-teal-soft" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Breadcrumbs
            inverted
            className="mb-6"
            items={[
              { name: "Courses", href: "/courses" },
              { name: course.title, href: `/courses/${course.slug}` },
            ]}
          />
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{course.tool}</Badge>
              <Badge variant="secondary">{course.level}</Badge>
              {!course.published ? <Badge variant="warning">Coming soon</Badge> : null}
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{course.title}</h1>
            <p className="mt-4 text-lg text-white/85">{course.subtitle}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              <li className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {course.duration}
              </li>
              {course.published ? (
                <li className="flex items-center gap-1.5">
                  <BookOpen className="size-4" aria-hidden="true" />
                  {course.modules.length} modules · {course.lessonCount} lessons
                </li>
              ) : null}
              <li className="flex items-center gap-1.5">
                <BarChart3 className="size-4" aria-hidden="true" />
                {course.level}
              </li>
              {course.certificate ? (
                <li className="flex items-center gap-1.5">
                  <Award className="size-4" aria-hidden="true" />
                  Certificate of completion
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {/* ---------- Main column ---------- */}
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="text-2xl font-semibold">
              Overview
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/90">{course.description}</p>
          </section>

          <PrivacyCallout />

          <section aria-labelledby="learn-heading">
            <h2 id="learn-heading" className="text-2xl font-semibold">
              What you&apos;ll learn
            </h2>
            <ul className="mt-4 grid gap-3 rounded-xl border bg-card p-6 sm:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-10 md:grid-cols-2">
            <section aria-labelledby="audience-heading">
              <h2 id="audience-heading" className="text-2xl font-semibold">
                Who it&apos;s for
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {course.audience.map((item) => (
                  <li key={item} className="flex gap-2">
                    <UserRound className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {HEALTHCARE_ROLES[role]}
                  </Badge>
                ))}
              </div>
            </section>
            <section aria-labelledby="prereq-heading">
              <h2 id="prereq-heading" className="text-2xl font-semibold">
                Prerequisites
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
                {course.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-labelledby="syllabus-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="syllabus-heading" className="text-2xl font-semibold">
                Syllabus
              </h2>
              {course.lessonCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {course.lessonCount} lessons · {formatMinutes(course.durationMinutes)} of content
                </p>
              ) : null}
            </div>
            <div className="mt-4">
              <Syllabus course={course} />
            </div>
          </section>

          {previews.length > 0 && course.published ? (
            <section aria-labelledby="preview-heading">
              <h2 id="preview-heading" className="text-2xl font-semibold">
                Free preview lessons
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {previews.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      href={`/learn/${course.slug}/${lesson.slug}`}
                      className="flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <PlayCircle className="size-6 text-teal" aria-hidden="true" />
                      <span className="mt-3 font-serif text-lg font-semibold text-primary">{lesson.title}</span>
                      <span className="mt-1 text-sm text-muted-foreground">{lesson.description}</span>
                      <span className="mt-3 text-sm font-medium text-teal">Watch free preview · {lesson.duration} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="instructor-heading">
            <h2 id="instructor-heading" className="text-2xl font-semibold">
              Your instructor
            </h2>
            <div className="mt-4 flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-navy-50 font-serif text-2xl font-semibold text-primary" aria-hidden="true">
                {siteConfig.instructor.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="font-serif text-xl font-semibold text-primary">{siteConfig.instructor.name}</p>
                <p className="text-sm text-teal">{siteConfig.instructor.title}</p>
                <p className="mt-3 text-sm text-muted-foreground">{siteConfig.instructor.bio[0]}</p>
                <Link href="/about#instructor" className="mt-2 inline-block text-sm font-medium text-teal hover:underline">
                  Read full bio
                </Link>
              </div>
            </div>
          </section>

          {course.certificate ? (
            <section aria-labelledby="certificate-heading" className="rounded-xl bg-navy-50 p-6">
              <h2 id="certificate-heading" className="flex items-center gap-2 text-2xl font-semibold">
                <Award className="size-6 text-teal" aria-hidden="true" />
                Certificate of completion
              </h2>
              <p className="mt-3 text-sm text-foreground/85">
                Complete every lesson to receive a downloadable PDF certificate showing your name, the course title and
                completion date. Each certificate has a unique verification ID that employers can check at{" "}
                <Link href="/verify" className="text-teal underline">
                  {siteConfig.url.replace(/^https?:\/\//, "")}/verify
                </Link>
                .
              </p>
            </section>
          ) : null}

          {course.faqs.length > 0 ? (
            <section aria-labelledby="course-faq-heading">
              <h2 id="course-faq-heading" className="text-2xl font-semibold">
                Course FAQs
              </h2>
              <Accordion type="single" collapsible className="mt-4 rounded-xl border bg-card px-4 sm:px-6">
                {course.faqs.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`cfaq-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : null}
        </div>

        {/* ---------- Sticky enrol card ---------- */}
        <aside aria-label="Enrolment" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-6 shadow-md">
            {course.published ? (
              <>
                <PriceTag price={course.price} size="lg" />
                <p className="mt-1 text-sm text-muted-foreground">One-time payment · lifetime access</p>
                <Button asChild size="lg" variant="teal" className="mt-5 w-full">
                  <Link href={`/enroll/${course.slug}`}>Enroll now</Link>
                </Button>
                {previews[0] ? (
                  <Button asChild variant="outline" className="mt-2 w-full">
                    <Link href={`/learn/${course.slug}/${previews[0].slug}`}>Try a free lesson</Link>
                  </Button>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Pay by bank transfer, JazzCash or Easypaisa. Access is activated after verification, usually within 24 hours.
                </p>
              </>
            ) : (
              <>
                <Badge variant="warning">Coming soon</Badge>
                <p className="mt-3 font-serif text-xl font-semibold text-primary">Expected {course.expectedLaunch ?? "soon"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Join our newsletter or contact us to be told as soon as this course opens.
                </p>
                <Button asChild className="mt-5 w-full">
                  <Link href="/contact">Notify me</Link>
                </Button>
              </>
            )}
            <ul className="mt-6 space-y-2 border-t pt-4 text-sm">
              <li className="flex items-center gap-2">
                <Smartphone className="size-4 text-teal" aria-hidden="true" />
                Learn on phone, tablet or computer
              </li>
              <li className="flex items-center gap-2">
                <InfinityIcon className="size-4 text-teal" aria-hidden="true" />
                Lifetime access and updates
              </li>
              {course.certificate ? (
                <li className="flex items-center gap-2">
                  <Award className="size-4 text-teal" aria-hidden="true" />
                  Verifiable certificate
                </li>
              ) : null}
            </ul>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Training a team?{" "}
            <Link href="/institutions" className="text-teal underline">
              Group options
            </Link>
          </p>
        </aside>
      </div>

      {/* Phones: keep the price and "Enroll now" button visible at the bottom of the screen */}
      {course.published ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 shadow-[0_-4px_12px_rgba(11,37,69,0.08)] backdrop-blur lg:hidden">
          <PriceTag price={course.price} />
          <Button asChild variant="teal">
            <Link href={`/enroll/${course.slug}`}>Enroll now</Link>
          </Button>
        </div>
      ) : null}
      {course.published ? <div className="h-16 lg:hidden" aria-hidden="true" /> : null}
    </>
  );
}
