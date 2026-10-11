"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/actions/public-forms";
import { initialFormState } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { FormMessage, Honeypot, SubmitButton } from "./form-fields";

export function NewsletterForm({ variant = "light", source = "website" }: { variant?: "light" | "dark"; source?: string }) {
  const [state, action] = useActionState(subscribeNewsletter, initialFormState);
  const id = `newsletter-email-${source}`;

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-2" noValidate>
      <Honeypot />
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <Input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your work email"
          defaultValue={state.values?.email}
          aria-invalid={state.errors?.email ? true : undefined}
          aria-describedby={state.errors?.email ? `${id}-error` : undefined}
          className={cn(variant === "dark" && "border-white/30 bg-white/10 text-white placeholder:text-white/60")}
        />
        <SubmitButton variant="teal" pendingText="Subscribing…">
          Subscribe
        </SubmitButton>
      </div>
      {state.errors?.email ? (
        <p id={`${id}-error`} className={cn("text-sm", variant === "dark" ? "text-red-200" : "text-destructive")}>
          {state.errors.email}
        </p>
      ) : null}
      <FormMessage state={state} />
    </form>
  );
}
