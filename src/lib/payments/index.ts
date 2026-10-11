/**
 * Payment provider registry. Add new providers to the list below.
 */
import "server-only";

import { manualProvider } from "./manual";
import { onlineGatewayProvider } from "./online-gateway.example";
import type { PaymentProvider } from "./types";

const providers: PaymentProvider[] = [manualProvider, onlineGatewayProvider];

export function getPaymentProvider(id: string): PaymentProvider | null {
  const provider = providers.find((p) => p.id === id);
  return provider && provider.isEnabled() ? provider : null;
}

export function getEnabledProviders(): PaymentProvider[] {
  return providers.filter((p) => p.isEnabled());
}

export type { PaymentProvider } from "./types";
