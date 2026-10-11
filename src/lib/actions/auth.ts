"use server";

/**
 * Server Actions for sign-up, login (password or magic link),
 * password reset, logout and profile updates.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { siteConfig } from "@/config/site";
import { getUser, safeNextPath } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  fieldErrors,
  formToObject,
  loginSchema,
  profileSchema,
  resetPasswordSchema,
  signupSchema,
  type FormState,
} from "@/lib/validation";

const NOT_CONFIGURED: FormState = {
  status: "error",
  message: "Accounts are not set up yet. The site owner needs to connect Supabase (see README).",
};

/** The site's address, used to build links in emails (works locally and on Vercel). */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : siteConfig.url;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const values = formToObject(formData);
  const parsed = signupSchema.safeParse(values);
  // Never echo the password back to the browser
  const safeValues = { ...values, password: "" };
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: safeValues };

  const next = safeNextPath(values.next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, profession: parsed.data.profession },
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { status: "error", message: error.message, values: safeValues };
  }

  // If email confirmation is switched off in Supabase, the user is logged in straight away.
  if (data.session) redirect(next);

  return {
    status: "success",
    message: `Almost done! We've sent a confirmation link to ${parsed.data.email}. Please open it to activate your account.`,
  };
}

export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const values = formToObject(formData);
  const parsed = loginSchema.safeParse(values);
  const safeValues = { email: values.email ?? "" };
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: safeValues };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Please confirm your email address first — check your inbox for our link."
        : "Incorrect email or password.";
    return { status: "error", message, values: safeValues };
  }
  redirect(safeNextPath(values.next));
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const values = formToObject(formData);
  const parsed = emailOnlySchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const next = safeNextPath(values.next);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      // Only existing accounts can use magic links; new users sign up first.
      shouldCreateUser: false,
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error && error.code !== "otp_disabled") {
    console.error("[auth] magic link:", error.message);
  }
  // Same message either way, so nobody can test which emails have accounts.
  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, a login link is on its way. Please open it on this device.`,
  };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const values = formToObject(formData);
  const parsed = emailOnlySchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) console.error("[auth] reset password:", error.message);
  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, we've sent a link to reset your password.`,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const user = await getUser();
  if (!user) return { status: "error", message: "Your reset link has expired. Please request a new one." };

  const parsed = resetPasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: error.message };
  redirect("/dashboard?message=password-updated");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Please log in again." };
  const values = formToObject(formData);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      profession: parsed.data.profession,
      organization: parsed.data.organization || null,
    })
    .eq("id", user.id);
  if (error) {
    console.error("[profile]", error.message);
    return { status: "error", message: "Could not save your profile. Please try again.", values };
  }
  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Your profile has been saved.", values };
}
