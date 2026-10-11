"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { submitInstitutionEnquiry } from "@/lib/actions/public-forms";
import { initialFormState } from "@/lib/validation";
import { Field, fieldAria, FormMessage, Honeypot, SubmitButton } from "./form-fields";

export function InstitutionForm() {
  const [state, action] = useActionState(submitInstitutionEnquiry, initialFormState);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <FormMessage state={state} />
      <Field id="organization" label="Organisation name" error={e.organization} required>
        <Input {...fieldAria("organization", e.organization)} autoComplete="organization" defaultValue={v.organization} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contactName" label="Your name" error={e.contactName} required>
          <Input {...fieldAria("contactName", e.contactName)} autoComplete="name" defaultValue={v.contactName} required />
        </Field>
        <Field id="role" label="Your role" error={e.role}>
          <Input {...fieldAria("role", e.role)} autoComplete="organization-title" defaultValue={v.role} placeholder="e.g. Head of Nursing Education" />
        </Field>
        <Field id="email" label="Work email" error={e.email} required>
          <Input {...fieldAria("email", e.email)} type="email" autoComplete="email" defaultValue={v.email} required />
        </Field>
        <Field id="phone" label="Phone / WhatsApp" error={e.phone}>
          <Input {...fieldAria("phone", e.phone)} type="tel" autoComplete="tel" defaultValue={v.phone} />
        </Field>
      </div>
      <Field id="staffCount" label="Approximate number of staff to train" error={e.staffCount} required>
        <NativeSelect {...fieldAria("staffCount", e.staffCount)} defaultValue={v.staffCount ?? ""} required>
          <option value="" disabled>
            Choose…
          </option>
          <option value="1-10">1–10</option>
          <option value="11-50">11–50</option>
          <option value="51-200">51–200</option>
          <option value="201-1000">201–1,000</option>
          <option value="1000+">More than 1,000</option>
        </NativeSelect>
      </Field>
      <Field id="message" label="Your training needs" error={e.message} hint="Which staff groups, topics, timelines and format (online, live, on-site)?" required>
        <Textarea {...fieldAria("message", e.message, "hint")} rows={6} defaultValue={v.message} required />
      </Field>
      <SubmitButton size="lg">Send enquiry</SubmitButton>
    </form>
  );
}
