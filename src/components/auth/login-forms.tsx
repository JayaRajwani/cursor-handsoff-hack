"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";

import { Field, fieldAria, FormMessage, SubmitButton } from "@/components/forms/form-fields";
import { Input } from "@/components/ui/input";
import { sendMagicLink, signInWithPassword } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** Login with password, or with a one-time "magic link" sent by email. */
export function LoginForms({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction] = useActionState(signInWithPassword, initialFormState);
  const [mlState, mlAction] = useActionState(sendMagicLink, initialFormState);

  return (
    <div>
      <div role="tablist" aria-label="Login method" className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["password", "Password", KeyRound],
            ["magic", "Email me a link", Mail],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 font-medium transition-colors",
              mode === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <FormMessage state={pwState} />
          <Field id="email" label="Email address" error={pwState.errors?.email}>
            <Input {...fieldAria("email", pwState.errors?.email)} type="email" autoComplete="email" defaultValue={pwState.values?.email} required />
          </Field>
          <Field id="password" label="Password" error={pwState.errors?.password}>
            <Input {...fieldAria("password", pwState.errors?.password)} type="password" autoComplete="current-password" required />
          </Field>
          <div className="text-right text-sm">
            <Link href="/forgot-password" className="text-teal hover:underline">
              Forgot password?
            </Link>
          </div>
          <SubmitButton className="w-full" size="lg" pendingText="Logging in…">
            Log in
          </SubmitButton>
        </form>
      ) : mlState.status === "success" ? (
        <FormMessage state={mlState} />
      ) : (
        <form action={mlAction} className="space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <FormMessage state={mlState} />
          <p className="text-sm text-muted-foreground">We&apos;ll email you a secure one-time link — no password needed.</p>
          <Field id="ml-email" label="Email address" error={mlState.errors?.email}>
            <Input id="ml-email" name="email" type="email" autoComplete="email" defaultValue={mlState.values?.email} required aria-invalid={mlState.errors?.email ? true : undefined} />
          </Field>
          <SubmitButton className="w-full" size="lg" pendingText="Sending link…">
            Send login link
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
