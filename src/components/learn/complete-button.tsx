"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, CheckCircle2, Circle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setLessonComplete } from "@/lib/actions/progress";

export function CompleteButton({
  courseSlug,
  lessonSlug,
  initiallyComplete,
  nextHref,
}: {
  courseSlug: string;
  lessonSlug: string;
  initiallyComplete: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [complete, setComplete] = useState(initiallyComplete);
  const [error, setError] = useState<string | null>(null);
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const target = !complete;
    setError(null);
    startTransition(async () => {
      const result = await setLessonComplete(courseSlug, lessonSlug, target);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setComplete(target);
      if (result.certificateCode) setCertificateCode(result.certificateCode);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggle} disabled={pending} variant={complete ? "success" : "default"} size="lg" aria-pressed={complete}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : complete ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
          {complete ? "Completed" : "Mark as complete"}
        </Button>
        {complete && nextHref ? (
          <Button asChild variant="outline" size="lg">
            <Link href={nextHref}>Next lesson →</Link>
          </Button>
        ) : null}
        {complete ? <span className="text-xs text-muted-foreground">Click again to mark as not complete.</span> : null}
      </div>
      <div aria-live="polite">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {certificateCode ? (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-4 text-sm text-success">
            <Award className="size-5 shrink-0" aria-hidden="true" />
            <p>
              <strong>Congratulations — you&apos;ve completed the course!</strong> Your certificate is ready.{" "}
              <Link href="/dashboard/certificates" className="underline">
                Download it from your dashboard
              </Link>
              .
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
