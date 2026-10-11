"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Field, fieldAria, FormMessage, SubmitButton } from "@/components/forms/form-fields";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { signUp } from "@/lib/actions/auth";
import { initialFormState, PROFESSIONS } from "@/lib/validation";

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState(signUp, initialFormState);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field id="fullName" label="Full name (as it should appear on certificates)" error={e.fullName} required>
        <Input {...fieldAria("fullName", e.fullName)} autoComplete="name" defaultValue={v.fullName} required />
      </Field>
      <Field id="email" label="Email address" error={e.email} required>
        <Input {...fieldAria("email", e.email)} type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field id="profession" label="Profession" error={e.profession} required>
        <NativeSelect {...fieldAria("profession", e.profession)} defaultValue={v.profession ?? ""} required>
          <option value="" disabled>
            Choose…
          </option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="password" label="Password" error={e.password} hint="At least 8 characters." required>
        <Input {...fieldAria("password", e.password, "hint")} type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-0.5 size-4 accent-[var(--teal)]"
            aria-invalid={e.acceptTerms ? true : undefined}
            aria-describedby={e.acceptTerms ? "acceptTerms-error" : undefined}
          />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="text-teal underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-teal underline" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {e.acceptTerms ? (
          <p id="acceptTerms-error" className="text-sm text-destructive">
            {e.acceptTerms}
          </p>
        ) : null}
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
