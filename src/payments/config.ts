import { MissingCredentialsError } from "./errors.js";

export type PayPalMode = "sandbox" | "live" | "mock";

export interface PayPalConfig {
  mode: PayPalMode;
  clientId: string;
  clientSecret: string;
  webhookId: string;
  returnUrl: string;
  cancelUrl: string;
  /** REST API base URL, derived from mode. Empty for mock. */
  apiBase: string;
}

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

const DEFAULT_RETURN_URL = "http://localhost:3000/payments/paypal/success";
const DEFAULT_CANCEL_URL = "http://localhost:3000/payments/paypal/cancel";

export interface LoadConfigOptions {
  /** Treat missing credentials as fatal instead of falling back to mock mode. */
  requireCredentials?: boolean;
  /** Emit a console warning when falling back to mock mode. Defaults to true. */
  warn?: boolean;
}

/**
 * Resolve PayPal configuration from environment variables.
 *
 * Resolution rules:
 * - PAYPAL_MODE=mock                  → mock mode (no network calls).
 * - PAYPAL_MODE=sandbox|live          → real mode; requires client id + secret.
 * - credentials missing in dev        → falls back to mock mode (unless requireCredentials).
 * - credentials missing in production → throws MissingCredentialsError.
 */
export function loadPayPalConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: LoadConfigOptions = {},
): PayPalConfig {
  const warn = options.warn ?? true;
  const rawMode = (env.PAYPAL_MODE ?? "").toLowerCase();
  const clientId = env.PAYPAL_CLIENT_ID ?? "";
  const clientSecret = env.PAYPAL_CLIENT_SECRET ?? "";
  const hasCredentials = Boolean(clientId && clientSecret);

  let mode: PayPalMode;
  if (rawMode === "mock") {
    mode = "mock";
  } else if (rawMode === "live") {
    mode = "live";
  } else {
    // Unset or "sandbox" both resolve to sandbox when credentials exist.
    mode = "sandbox";
  }

  if (mode !== "mock" && !hasCredentials) {
    const isProd = env.NODE_ENV === "production" || options.requireCredentials;
    if (isProd) {
      throw new MissingCredentialsError(
        "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required for sandbox/live mode.",
      );
    }
    if (warn) {
      console.warn(
        "[paypal] No credentials found — falling back to mock mode. Set PAYPAL_CLIENT_ID/SECRET or PAYPAL_MODE=mock to silence.",
      );
    }
    mode = "mock";
  }

  return {
    mode,
    clientId,
    clientSecret,
    webhookId: env.PAYPAL_WEBHOOK_ID ?? "",
    returnUrl: env.PAYPAL_RETURN_URL ?? DEFAULT_RETURN_URL,
    cancelUrl: env.PAYPAL_CANCEL_URL ?? DEFAULT_CANCEL_URL,
    apiBase: mode === "live" ? LIVE_BASE : mode === "sandbox" ? SANDBOX_BASE : "",
  };
}
