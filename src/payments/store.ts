import type { PaymentEvent, PaymentIntent, SponsorshipCommitment } from "./types.js";

/**
 * Persistence boundary for payment records. The in-memory implementation is the
 * default for development and tests; a production deployment swaps in a
 * database-backed store implementing the same interface.
 */
export interface PaymentStore {
  saveIntent(intent: PaymentIntent): void;
  getIntent(id: string): PaymentIntent | undefined;
  listIntents(): PaymentIntent[];

  saveCommitment(commitment: SponsorshipCommitment): void;
  getCommitment(id: string): SponsorshipCommitment | undefined;
  getCommitmentByIntent(paymentIntentId: string): SponsorshipCommitment | undefined;
  listCommitments(): SponsorshipCommitment[];

  saveEvent(event: PaymentEvent): void;
  listEvents(): PaymentEvent[];
  /** Returns true if a provider webhook event id has already been recorded. */
  hasProcessedProviderEvent(providerEventId: string): boolean;
}

export class InMemoryPaymentStore implements PaymentStore {
  private intents = new Map<string, PaymentIntent>();
  private commitments = new Map<string, SponsorshipCommitment>();
  private events = new Map<string, PaymentEvent>();
  private processedProviderEventIds = new Set<string>();

  saveIntent(intent: PaymentIntent): void {
    this.intents.set(intent.id, { ...intent });
  }

  getIntent(id: string): PaymentIntent | undefined {
    const found = this.intents.get(id);
    return found ? { ...found } : undefined;
  }

  listIntents(): PaymentIntent[] {
    return [...this.intents.values()].map((i) => ({ ...i }));
  }

  saveCommitment(commitment: SponsorshipCommitment): void {
    this.commitments.set(commitment.id, { ...commitment, notes: [...commitment.notes] });
  }

  getCommitment(id: string): SponsorshipCommitment | undefined {
    const found = this.commitments.get(id);
    return found ? { ...found, notes: [...found.notes] } : undefined;
  }

  getCommitmentByIntent(paymentIntentId: string): SponsorshipCommitment | undefined {
    for (const c of this.commitments.values()) {
      if (c.paymentIntentId === paymentIntentId) return { ...c, notes: [...c.notes] };
    }
    return undefined;
  }

  listCommitments(): SponsorshipCommitment[] {
    return [...this.commitments.values()].map((c) => ({ ...c, notes: [...c.notes] }));
  }

  saveEvent(event: PaymentEvent): void {
    this.events.set(event.id, { ...event });
    if (event.status !== "failed") {
      this.processedProviderEventIds.add(event.providerEventId);
    }
  }

  listEvents(): PaymentEvent[] {
    return [...this.events.values()].map((e) => ({ ...e }));
  }

  hasProcessedProviderEvent(providerEventId: string): boolean {
    return this.processedProviderEventIds.has(providerEventId);
  }
}
