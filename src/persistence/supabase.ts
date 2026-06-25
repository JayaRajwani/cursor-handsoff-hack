import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { HackOSRunResult } from "../orchestration/HackOSApiOrchestrator.js";

export type SupabaseSaveResult =
  | { saved: true; runId: string }
  | { saved: false; error: string };

let client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  client ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export async function saveHackOSRun(result: HackOSRunResult): Promise<SupabaseSaveResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { saved: false, error: "Supabase environment variables are not configured." };
  }

  try {
    const { data, error } = await insertExtendedRun(supabase, result);

    if (error && isSchemaCacheColumnError(error)) {
      const fallback = await insertLegacyRun(supabase, result);
      if (fallback.error) throw fallback.error;
      return { saved: true, runId: fallback.data.id as string };
    }

    if (error) throw error;
    return { saved: true, runId: data.id as string };
  } catch (error) {
    return {
      saved: false,
      error: formatPersistenceError(error),
    };
  }
}

function insertExtendedRun(supabase: SupabaseClient, result: HackOSRunResult) {
  return supabase
    .from("hackos_runs")
    .insert({
      goal: result.goal,
      organizer_output: result.organizer,
      sponsorship_output: result.sponsorship,
      community_output: result.community,
      paypal_output: result.paypal,
      whatsapp_output: result.whatsapp,
      agent_sources: result.metadata.agentSources,
      agent_errors: result.metadata.agentErrors,
    })
    .select("id")
    .single();
}

function insertLegacyRun(supabase: SupabaseClient, result: HackOSRunResult) {
  return supabase
    .from("hackos_runs")
    .insert({
      goal: result.goal,
      organizer_output: result.organizer,
      sponsorship_output: {
        paymentPipeline: result.sponsorship,
        paypal: result.paypal,
        community: result.community,
        whatsapp: result.whatsapp,
      },
      agent_sources: result.metadata.agentSources,
      agent_errors: result.metadata.agentErrors,
    })
    .select("id")
    .single();
}

function isSchemaCacheColumnError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const record = error as Record<string, unknown>;
  return record.code === "PGRST204";
}

function formatPersistenceError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((part): part is string => typeof part === "string" && part.length > 0);
    if (parts.length > 0) return parts.join(" | ");
    return JSON.stringify(record);
  }
  return "Unknown Supabase persistence error.";
}
