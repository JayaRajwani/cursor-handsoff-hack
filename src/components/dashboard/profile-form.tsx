"use client";

import { useActionState } from "react";

import { Field, fieldAria, FormMessage, SubmitButton } from "@/components/forms/form-fields";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { updateProfile } from "@/lib/actions/auth";
import { initialFormState, PROFESSIONS } from "@/lib/validation";

export function ProfileForm({ defaults }: { defaults: { fullName: string; profession: string; organization: string; email: string } }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field id="email-display" label="Email address" hint="Contact us if you need to change your email address.">
        <Input id="email-display" value={defaults.email} disabled readOnly aria-describedby="email-display-hint" />
      </Field>
      <Field id="fullName" label="Full name" error={e.fullName} hint="This name is printed on your certificates." required>
        <Input {...fieldAria("fullName", e.fullName, "hint")} defaultValue={v.fullName ?? defaults.fullName} autoComplete="name" required />
      </Field>
      <Field id="profession" label="Profession" error={e.profession} required>
        <NativeSelect {...fieldAria("profession", e.profession)} defaultValue={v.profession ?? defaults.profession} required>
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
      <Field id="organization" label="Organisation (optional)" error={e.organization}>
        <Input {...fieldAria("organization", e.organization)} defaultValue={v.organization ?? defaults.organization} autoComplete="organization" />
      </Field>
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
