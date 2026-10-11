import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

import { PriceTag } from "@/components/course/price-tag";
import { PaymentForm } from "@/components/enroll/payment-form";
import { SubmitButton } from "@/components/forms/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatPkr, paymentConfig } from "@/config/payment";
import { enrollFree } from "@/lib/actions/enrollment";
import { requireUser } from "@/lib/auth";
import { getCourse, getCourseLessons } from "@/lib/content/courses";
import { getEnrollment, getLatestPayment } from "@/lib/data/learning";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ submitted?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse((await params).slug);
  return createMetadata({
    title: course ? `Enrol: ${course.title}` : "Enrol",
    description: "Complete your enrolment.",
    path: `/enroll/${(await params).slug}`,
    noIndex: true,
  });
}

export default async function EnrollPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { submitted } = await searchParams;
  const course = getCourse(slug);
  if (!course || !course.published) notFound();

  const user = await requireUser(`/enroll/${slug}`);
  const enrollment = await getEnrollment(user.id, slug);
  const firstLesson = getCourseLessons(course)[0];

  // Already enrolled → go straight to the course
  if (enrollment?.status === "active") redirect(firstLesson ? `/learn/${slug}/${firstLesson.slug}` : "/dashboard");

  const payment = enrollment ? await getLatestPayment(user.id, slug) : null;

  return (
    <div className="bg-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:py-14">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-teal uppercase">Enrolment</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{course.title}</h1>
          </div>

          {submitted || enrollment?.status === "pending" ? (
            <Alert variant="info" role="status">
              <Clock aria-hidden="true" />
              <AlertTitle>Payment received — pending verification</AlertTitle>
              <AlertDescription>
                <p>
                  Thank you! We received your payment details
                  {payment ? ` (transaction ${payment.transaction_id}, submitted ${formatDate(payment.created_at)})` : ""}.{" "}
                  {paymentConfig.reviewTimeMessage}
                </p>
                <p>
                  Meanwhile you can{" "}
                  {firstLesson ? (
                    <Link href={`/learn/${slug}/${firstLesson.slug}`} className="underline">
                      start the free preview lessons
                    </Link>
                  ) : (
                    "browse the course"
                  )}
                  . Made a mistake? You can submit corrected details below.
                </p>
              </AlertDescription>
            </Alert>
          ) : null}

          {enrollment?.status === "rejected" ? (
            <Alert variant="destructive" role="alert">
              <XCircle aria-hidden="true" />
              <AlertTitle>We could not verify your previous payment</AlertTitle>
              <AlertDescription>
                {payment?.admin_note ? <p>Note from our team: {payment.admin_note}</p> : null}
                <p>Please check the details and submit them again, or contact us for help.</p>
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8" aria-label="Payment">
            {course.price.pkr === 0 ? (
              <form action={enrollFree} className="space-y-4">
                <input type="hidden" name="courseSlug" value={course.slug} />
                <p>This course is free. Click below to start learning straight away.</p>
                <SubmitButton size="lg" variant="teal" pendingText="Enrolling…">
                  Enrol for free
                </SubmitButton>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">How to pay</h2>
                <ol className="mt-3 mb-8 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>
                    Send <strong className="text-foreground">{formatPkr(course.price.pkr)}</strong> using one of the methods below.
                  </li>
                  <li>Take a screenshot of the confirmation.</li>
                  <li>Upload it with the transaction ID. We&apos;ll email you when your access is active.</li>
                </ol>
                <PaymentForm courseSlug={course.slug} methods={[...paymentConfig.methods]} maxMb={paymentConfig.maxScreenshotMb} />
              </>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Course fee</p>
            <PriceTag price={course.price} size="lg" />
            <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
              {[`${course.lessonCount} lessons · ${course.duration}`, "Lifetime access", "Certificate of completion"].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-teal" aria-hidden="true" />
            Your receipt is stored privately and is only visible to you and our verification team.
          </div>
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/courses/${course.slug}`}>← Back to course details</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
