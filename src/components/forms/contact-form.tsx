"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/lib/actions/public-forms";
import { initialFormState } from "@/lib/validation";
import { Field, fieldAria, FormMessage, Honeypot, SubmitButton } from "./form-fields";

export function ContactForm() {
  const [state, action] = useActionState(submitContact, initialFormState);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Your name" error={e.name} required>
          <Input {...fieldAria("name", e.name)} autoComplete="name" defaultValue={v.name} required />
        </Field>
        <Field id="email" label="Email address" error={e.email} required>
          <Input {...fieldAria("email", e.email)} type="email" autoComplete="email" defaultValue={v.email} required />
        </Field>
      </div>
      <Field id="subject" label="Subject" error={e.subject} required>
        <Input {...fieldAria("subject", e.subject)} defaultValue={v.subject} required />
      </Field>
      <Field id="message" label="Message" error={e.message} hint="Please do not include any patient information." required>
        <Textarea {...fieldAria("message", e.message, "hint")} rows={6} defaultValue={v.message} required />
      </Field>
      <SubmitButton size="lg">Send message</SubmitButton>
    </form>
  );
}
