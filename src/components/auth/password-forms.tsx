"use client";

import { useActionState } from "react";

import { Field, fieldAria, FormMessage, SubmitButton } from "@/components/forms/form-fields";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, updatePassword } from "@/lib/actions/auth";
import { initialFormState } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field id="email" label="Email address" error={state.errors?.email}>
        <Input {...fieldAria("email", state.errors?.email)} type="email" autoComplete="email" defaultValue={state.values?.email} required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field id="password" label="New password" error={e.password} hint="At least 8 characters.">
        <Input {...fieldAria("password", e.password, "hint")} type="password" autoComplete="new-password" required />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={e.confirmPassword}>
        <Input {...fieldAria("confirmPassword", e.confirmPassword)} type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
