"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";

import { Field, fieldAria, FormMessage, SubmitButton } from "@/components/forms/form-fields";
import { Input } from "@/components/ui/input";
import { submitManualPayment } from "@/lib/actions/enrollment";
import { initialFormState } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Method = { id: string; label: string; details: { label: string; value: string }[]; note?: string };

/** Step 1: choose method and see account details. Step 2: upload proof. */
export function PaymentForm({ courseSlug, methods, maxMb }: { courseSlug: string; methods: Method[]; maxMb: number }) {
  const [state, action] = useActionState(submitManualPayment, initialFormState);
  const [method, setMethod] = useState<string>(state.values?.method ?? methods[0]?.id ?? "");
  const [fileError, setFileError] = useState<string | null>(null);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const selected = methods.find((m) => m.id === method);

  function checkFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.size > maxMb * 1024 * 1024) {
      setFileError(`This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please choose a file under ${maxMb} MB.`);
      event.target.value = "";
    } else setFileError(null);
  }

  return (
    <form action={action} className="space-y-8" noValidate>
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <FormMessage state={state} />

      <fieldset>
        <legend className="font-serif text-xl font-semibold text-primary">1. Choose how you will pay</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {methods.map((m) => (
            <label
              key={m.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal",
                method === m.id ? "border-teal bg-teal-50 text-teal-strong" : "hover:border-teal/50",
              )}
            >
              <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[var(--teal)]" />
              {m.label}
            </label>
          ))}
        </div>
        {e.method ? <p className="mt-2 text-sm text-destructive">{e.method}</p> : null}

        {selected ? (
          <div className="mt-4 rounded-lg border bg-muted p-4" aria-live="polite">
            <p className="text-sm font-semibold text-primary">Send the course fee to:</p>
            <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              {selected.details.map((d) => (
                <div key={d.label} className="contents">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="font-medium break-all text-foreground">{d.value}</dd>
                </div>
              ))}
            </dl>
            {selected.note ? <p className="mt-3 text-xs text-muted-foreground">{selected.note}</p> : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-xl font-semibold text-primary">2. Tell us about your payment</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="transactionId" label="Transaction / reference ID" error={e.transactionId} hint="Shown on your receipt or SMS." required>
            <Input {...fieldAria("transactionId", e.transactionId, "hint")} defaultValue={v.transactionId} autoComplete="off" required />
          </Field>
          <Field id="payerName" label="Name on the paying account" error={e.payerName} required>
            <Input {...fieldAria("payerName", e.payerName)} defaultValue={v.payerName} autoComplete="name" required />
          </Field>
        </div>
        <Field
          id="screenshot"
          label="Screenshot of your receipt"
          error={fileError ?? e.screenshot}
          hint={`JPG, PNG, WEBP or PDF, up to ${maxMb} MB. Make sure the amount, date and transaction ID are visible.`}
          required
        >
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              {...fieldAria("screenshot", fileError ?? e.screenshot, "hint")}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={checkFile}
              required
              className="h-auto py-1.5"
            />
          </div>
        </Field>
      </fieldset>

      <SubmitButton size="lg" variant="teal" className="w-full sm:w-auto" pendingText="Uploading…">
        Submit payment for verification
      </SubmitButton>
    </form>
  );
}
