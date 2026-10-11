import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Clock, LogOut, PlayCircle, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { signOut } from "@/lib/actions/auth";
import { getProfile, requireUser } from "@/lib/auth";
import { getCourseLessons } from "@/lib/content/courses";
import { getDashboardData } from "@/lib/data/learning";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "My dashboard", description: "Your courses and progress.", path: "/dashboard", noIndex: true });

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const user = await requireUser("/dashboard");
  const [profile, { courses }, { message, error }] = await Promise.all([getProfile(), getDashboardData(user.id), searchParams]);
  const firstName = (profile?.full_name || "").split(" ")[0];

  const active = courses.filter((c) => c.enrollment.status === "active");
  const pending = courses.filter((c) => c.enrollment.status === "pending");
  const rejected = courses.filter((c) => c.enrollment.status === "rejected");
  const resume = active.find((c) => c.percent < 100) ?? active[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="mt-1 text-muted-foreground">Pick up where you left off.</p>
        </div>
        <form action={signOut} className="lg:hidden">
          <Button type="submit" variant="ghost" size="sm">
            <LogOut aria-hidden="true" />
            Log out
          </Button>
        </form>
      </div>

      {message === "password-updated" ? (
        <Alert variant="success" role="status">
          <AlertDescription>Your password has been updated.</AlertDescription>
        </Alert>
      ) : null}
      {error === "not-admin" ? (
        <Alert variant="warning" role="alert">
          <AlertDescription>That page is only available to administrators.</AlertDescription>
        </Alert>
      ) : null}
      {!profile?.full_name ? (
        <Alert variant="info">
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription>
            <p>
              Add your full name so it appears correctly on your certificates.{" "}
              <Link href="/dashboard/profile" className="underline">
                Update profile
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Continue where you left off */}
      {resume && resume.continueSlug ? (
        <section aria-labelledby="continue-heading" className="overflow-hidden rounded-xl bg-primary text-white shadow-sm">
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <p id="continue-heading" className="text-sm font-semibold tracking-wide text-teal-soft uppercase">
                Continue learning
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold text-white">{resume.course.title}</p>
              <p className="mt-1 text-sm text-white/85">
                Next up: {getCourseLessons(resume.course).find((l) => l.slug === resume.continueSlug)?.title}
              </p>
              <div className="mt-4 flex max-w-sm items-center gap-3">
                <Progress value={resume.percent} className="bg-white/20" aria-label={`${resume.percent}% complete`} />
                <span className="text-sm font-medium">{resume.percent}%</span>
              </div>
            </div>
            <Button asChild size="lg" variant="teal">
              <Link href={`/learn/${resume.course.slug}/${resume.continueSlug}`}>
                <PlayCircle aria-hidden="true" />
                Continue
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {pending.map(({ course }) => (
        <Alert key={course.slug} variant="info" role="status">
          <Clock aria-hidden="true" />
          <AlertTitle>{course.title}: payment pending verification</AlertTitle>
          <AlertDescription>
            <p>We&apos;ll email you as soon as your access is activated — usually within 24 hours on working days.</p>
          </AlertDescription>
        </Alert>
      ))}
      {rejected.map(({ course }) => (
        <Alert key={course.slug} variant="destructive" role="alert">
          <XCircle aria-hidden="true" />
          <AlertTitle>{course.title}: payment not verified</AlertTitle>
          <AlertDescription>
            <p>
              Please{" "}
              <Link href={`/enroll/${course.slug}`} className="underline">
                check and resubmit your payment details
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      ))}

      <section aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="text-2xl font-semibold">
          My courses
        </h2>
        {active.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed bg-card p-10 text-center">
            <BookOpen className="mx-auto size-8 text-teal" aria-hidden="true" />
            <p className="mt-3 font-medium text-primary">You are not enrolled in any courses yet.</p>
            <Button asChild className="mt-4" variant="teal">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {active.map(({ course, percent, completedCount, continueSlug, certificate }) => (
              <li key={course.slug} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="relative aspect-[16/7] bg-primary">
                  <Image src={course.image} alt="" fill unoptimized sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg leading-snug font-semibold">{course.title}</h3>
                    {percent === 100 ? <Badge variant="success">Completed</Badge> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={percent} aria-label={`${percent}% complete`} />
                    <span className="text-sm font-medium whitespace-nowrap">{percent}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} of {course.lessonCount} lessons complete
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {continueSlug ? (
                      <Button asChild size="sm">
                        <Link href={`/learn/${course.slug}/${continueSlug}`}>{percent === 0 ? "Start course" : percent === 100 ? "Review course" : "Continue"}</Link>
                      </Button>
                    ) : null}
                    {certificate ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/certificates/${certificate.verification_code}`}>
                          <Award aria-hidden="true" />
                          Certificate
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
