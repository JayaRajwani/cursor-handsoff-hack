import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { HackOSRunResult } from "./orchestrator.js";

export type SupabaseSaveResult =
  | {
      saved: true;
      runId: string;
    }
  | {
      saved: false;
      error: string;
    };

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabase;
}

export async function saveHackOSRun(result: HackOSRunResult): Promise<SupabaseSaveResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { saved: false, error: "Supabase environment variables are not configured." };
  }

  try {
    const { data, error } = await client
      .from("hackos_runs")
      .insert({
        goal: result.goal,
        organizer_output: result.organizer,
        sponsorship_output: result.sponsorship,
        agent_sources: result.metadata.agentSources,
        agent_errors: result.metadata.agentErrors
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return { saved: true, runId: data.id as string };
  } catch (error) {
    return {
      saved: false,
      error: error instanceof Error ? error.message : "Unknown Supabase persistence error."
    };
  }
}
