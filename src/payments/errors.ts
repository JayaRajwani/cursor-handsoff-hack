/**
 * Typed payment errors. Each carries a stable machine-readable `code` and an
 * `httpStatus` so API routes can return clean, typed JSON error responses
 * without leaking internals or credentials.
 */

export type PaymentErrorCode =
  | "missing_credentials"
  | "invalid_amount"
  | "unsupported_currency"
  | "sponsor_not_found"
  | "payment_not_found"
  | "order_creation_failed"
  | "capture_failed"
  | "checkout_cancelled"
  | "webhook_verification_failed"
  | "duplicate_webhook_event"
  | "payment_already_captured"
  | "amount_mismatch"
  | "currency_mismatch"
  | "invalid_request";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PaymentErrorCode,
    message: string,
    httpStatus = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  /** Safe, serialisable representation for API responses (never includes secrets). */
  toJSON(): { error: { code: PaymentErrorCode; message: string; details?: Record<string, unknown> } } {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

export class MissingCredentialsError extends PaymentError {
  constructor(message = "PayPal credentials are not configured") {
    super("missing_credentials", message, 500);
    this.name = "MissingCredentialsError";
  }
}

export class InvalidAmountError extends PaymentError {
  constructor(amount: unknown) {
    super("invalid_amount", `Invalid payment amount: ${String(amount)}. Amount must be a positive number.`, 422, {
      amount,
    });
    this.name = "InvalidAmountError";
  }
}

export class UnsupportedCurrencyError extends PaymentError {
  constructor(currency: unknown) {
    super("unsupported_currency", `Unsupported currency: ${String(currency)}.`, 422, { currency });
    this.name = "UnsupportedCurrencyError";
  }
}

export class SponsorNotFoundError extends PaymentError {
  constructor(sponsorId: string) {
    super("sponsor_not_found", `Sponsor not found: ${sponsorId}`, 404, { sponsorId });
    this.name = "SponsorNotFoundError";
  }
}

export class PaymentNotFoundError extends PaymentError {
  constructor(paymentIntentId: string) {
    super("payment_not_found", `Payment intent not found: ${paymentIntentId}`, 404, { paymentIntentId });
    this.name = "PaymentNotFoundError";
  }
}

export class OrderCreationError extends PaymentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("order_creation_failed", `Failed to create PayPal order: ${message}`, 502, details);
    this.name = "OrderCreationError";
  }
}

export class CaptureError extends PaymentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("capture_failed", `Failed to capture PayPal order: ${message}`, 502, details);
    this.name = "CaptureError";
  }
}

export class CheckoutCancelledError extends PaymentError {
  constructor(paymentIntentId: string) {
    super("checkout_cancelled", `Checkout was cancelled for payment: ${paymentIntentId}`, 409, { paymentIntentId });
    this.name = "CheckoutCancelledError";
  }
}

export class WebhookVerificationError extends PaymentError {
  constructor(message = "Webhook signature verification failed") {
    super("webhook_verification_failed", message, 400);
    this.name = "WebhookVerificationError";
  }
}

export class DuplicateWebhookError extends PaymentError {
  constructor(providerEventId: string) {
    super("duplicate_webhook_event", `Duplicate webhook event ignored: ${providerEventId}`, 200, { providerEventId });
    this.name = "DuplicateWebhookError";
  }
}

export class PaymentAlreadyCapturedError extends PaymentError {
  constructor(paymentIntentId: string) {
    super("payment_already_captured", `Payment already captured: ${paymentIntentId}`, 409, { paymentIntentId });
    this.name = "PaymentAlreadyCapturedError";
  }
}

export class AmountMismatchError extends PaymentError {
  constructor(expected: number, actual: number) {
    super("amount_mismatch", `Captured amount ${actual} does not match expected ${expected}.`, 409, {
      expected,
      actual,
    });
    this.name = "AmountMismatchError";
  }
}

export class CurrencyMismatchError extends PaymentError {
  constructor(expected: string, actual: string) {
    super("currency_mismatch", `Captured currency ${actual} does not match expected ${expected}.`, 409, {
      expected,
      actual,
    });
    this.name = "CurrencyMismatchError";
  }
}
