import { formatMoney, type Currency } from "./types.js";

export interface SponsorMessageContext {
  contactName: string;
  packageName: string;
  eventName: string;
  amount: number;
  currency: Currency;
  checkoutUrl: string;
}

/** Replace {{token}} placeholders. Unknown tokens are left intact for visibility. */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key]! : match,
  );
}

const PAYMENT_LINK_TEMPLATE = `Hi {{contactName}},

Thank you again for confirming {{packageName}} sponsorship for {{eventName}}.

You can complete the {{amount}} {{currency}} sponsorship payment here:

{{checkoutUrl}}

Once payment is complete, we will send confirmation and the next sponsor onboarding steps.

Best,
HackOS`;

const PAYMENT_RECEIVED_TEMPLATE = `Hi {{contactName}},

Thank you — we have received the {{amount}} {{currency}} payment for {{packageName}} sponsorship of {{eventName}}.

We will now move ahead with sponsor onboarding and send the next steps shortly.

Best,
HackOS`;

const PAYMENT_FAILED_TEMPLATE = `Hi {{contactName}},

It looks like the payment for {{packageName}} sponsorship of {{eventName}} did not complete.

You can try again here:

{{checkoutUrl}}

If there is an issue with the link, let us know and we can send an alternative.

Best,
HackOS`;

function baseValues(ctx: SponsorMessageContext): Record<string, string> {
  return {
    contactName: ctx.contactName,
    packageName: ctx.packageName,
    eventName: ctx.eventName,
    amount: formatMoney(ctx.amount, ctx.currency),
    currency: ctx.currency,
    checkoutUrl: ctx.checkoutUrl,
  };
}

export function paymentLinkMessage(ctx: SponsorMessageContext): string {
  return renderTemplate(PAYMENT_LINK_TEMPLATE, baseValues(ctx));
}

export function paymentReceivedMessage(ctx: SponsorMessageContext): string {
  return renderTemplate(PAYMENT_RECEIVED_TEMPLATE, baseValues(ctx));
}

export function paymentFailedMessage(ctx: SponsorMessageContext): string {
  return renderTemplate(PAYMENT_FAILED_TEMPLATE, baseValues(ctx));
}
