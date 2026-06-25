import { formatMoney, type Currency, type PaymentStatus } from "../payments/types.js";

export interface ApprovalViewData {
  paymentIntentId: string;
  sponsorName: string;
  eventName: string;
  packageName: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  checkoutUrl: string;
  messageDraft: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Internal operator approval view. This is a human checkpoint, not the product.
 * Self-contained HTML (inline CSS/JS) so it can be served without a build step.
 */
export function renderApprovalView(data: ApprovalViewData): string {
  const amount = formatMoney(data.amount, data.currency);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HackOS — Approve sponsor payment link</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 -apple-system, system-ui, sans-serif; margin: 0; background: #0f1115; color: #e8eaed; }
  .card { max-width: 560px; margin: 48px auto; background: #181b21; border: 1px solid #272b33; border-radius: 12px; padding: 28px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #9aa0a6; margin: 0 0 20px; font-size: 13px; }
  dl { display: grid; grid-template-columns: 130px 1fr; gap: 8px 16px; margin: 0 0 20px; }
  dt { color: #9aa0a6; } dd { margin: 0; font-weight: 600; }
  .status { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #2a2f3a; }
  .amount { font-size: 22px; }
  textarea { width: 100%; box-sizing: border-box; min-height: 150px; background: #0f1115; color: #e8eaed; border: 1px solid #272b33; border-radius: 8px; padding: 12px; font: 13px/1.5 ui-monospace, monospace; resize: vertical; }
  .row { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
  button { font: inherit; font-weight: 600; border: 0; border-radius: 8px; padding: 10px 16px; cursor: pointer; }
  .approve { background: #2e7d32; color: #fff; } .cancel { background: #3a3f4b; color: #fff; } .copy { background: #1f6feb; color: #fff; }
  .link { word-break: break-all; color: #6ab0ff; font-size: 13px; }
  #toast { margin-top: 14px; color: #7ee787; font-size: 13px; min-height: 18px; }
  label { display: block; color: #9aa0a6; font-size: 13px; margin: 0 0 6px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Approve sponsor payment link</h1>
    <p class="sub">Human checkpoint — nothing is sent to the sponsor until you approve.</p>
    <dl>
      <dt>Sponsor</dt><dd>${escapeHtml(data.sponsorName)}</dd>
      <dt>Event</dt><dd>${escapeHtml(data.eventName)}</dd>
      <dt>Package</dt><dd>${escapeHtml(data.packageName)}</dd>
      <dt>Amount</dt><dd class="amount">${escapeHtml(amount)} ${escapeHtml(data.currency)}</dd>
      <dt>Status</dt><dd><span class="status">${escapeHtml(data.status)}</span></dd>
      <dt>Checkout link</dt><dd class="link" id="checkout">${escapeHtml(data.checkoutUrl)}</dd>
    </dl>
    <label for="msg">Draft message to sponsor</label>
    <textarea id="msg" readonly>${escapeHtml(data.messageDraft)}</textarea>
    <div class="row">
      <button class="approve" id="approveBtn">Approve &amp; send link</button>
      <button class="cancel" id="cancelBtn">Cancel</button>
      <button class="copy" id="copyBtn">Copy link</button>
    </div>
    <div id="toast"></div>
  </div>
<script>
  const intentId = ${JSON.stringify(data.paymentIntentId)};
  const checkoutUrl = ${JSON.stringify(data.checkoutUrl)};
  const toast = (m) => { document.getElementById('toast').textContent = m; };
  document.getElementById('copyBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(checkoutUrl); toast('Checkout link copied.'); }
    catch { toast('Copy failed — select the link manually.'); }
  };
  document.getElementById('approveBtn').onclick = async () => {
    toast('Sending…');
    const res = await fetch('/api/payments/' + encodeURIComponent(intentId) + '/approve-send-link', { method: 'POST' });
    const data = await res.json();
    toast(res.ok ? 'Approved — link sent to ' + (data.sponsorName || 'sponsor') + '.' : 'Error: ' + (data.error?.message || res.status));
  };
  document.getElementById('cancelBtn').onclick = () => toast('Cancelled — link not sent.');
</script>
</body>
</html>`;
}
