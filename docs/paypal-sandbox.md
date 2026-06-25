# PayPal Sandbox Setup

This guide covers local PayPal sandbox configuration for HackOS sponsorship
payments. Sandbox credentials are secrets: never commit the credential CSV,
`.env.local`, passwords, the client secret, or any generated credentials.

## 1. Run the setup script

The setup script reads the PayPal sandbox credential CSV and writes a local
`.env.local`. It never prints the client secret or any password, and it adds the
secret files to `.gitignore`.

```bash
# Default CSV path (/mnt/data/paypal-sandbox-kit.csv):
npm run setup:paypal

# Explicit path (e.g. the kit downloaded to your machine):
npm run setup:paypal -- /path/to/paypal-sandbox-kit.csv

# Or via environment variable:
PAYPAL_KIT_CSV=/path/to/paypal-sandbox-kit.csv npm run setup:paypal
```

The script:

1. Reads the CSV.
2. Validates that all required columns are present.
3. Extracts the first row.
4. Creates or updates `.env.local` (existing unrelated keys are preserved).
5. Prints only a masked client ID and masked emails. The client secret stays hidden.
6. Ensures `.env.local`, `.env`, `.env.*.local`, and the CSV are gitignored.

After running, `.env.local` will contain:

| Variable | Source |
| --- | --- |
| `PAYPAL_CLIENT_ID` | `client_id` |
| `PAYPAL_CLIENT_SECRET` | `client_secret` |
| `PAYPAL_MODE` | `sandbox` |
| `PAYPAL_BUSINESS_EMAIL` | `business_email` |
| `PAYPAL_SANDBOX_BUYER_EMAIL` | `personal_email` |
| `PAYPAL_WEBHOOK_ID` | `placeholder_for_now` (set after creating a webhook) |
| `PAYPAL_RETURN_URL` | `http://localhost:3000/payments/paypal/success` |
| `PAYPAL_CANCEL_URL` | `http://localhost:3000/payments/paypal/cancel` |

`.env.example` documents these keys with placeholder values and is safe to commit.

## 2. Sandbox accounts

The credential kit provisions two PayPal sandbox test accounts:

- **Business (merchant) account** — `business_email` in the CSV, exposed as
  `PAYPAL_BUSINESS_EMAIL`. This is the account that *receives* sponsorship
  payments. The REST app's `client_id` / `client_secret` belong to this
  business account. Use it to log into the sandbox and inspect incoming
  transactions and webhook events.

- **Personal (buyer) account** — `personal_email` in the CSV, exposed as
  `PAYPAL_SANDBOX_BUYER_EMAIL`. This is the simulated sponsor who *pays*. Use it
  to complete checkout during testing.

You can review both accounts at
<https://developer.paypal.com/dashboard/accounts> while logged into the
developer dashboard. Passwords live only in the CSV (and, after setup, are not
written to `.env.local`); look them up there when you need to log into the
sandbox site.

## 3. Create a test sponsorship payment

With `PAYPAL_MODE=sandbox`, all API calls hit `https://api-m.sandbox.paypal.com`.

1. Start the app (`npm run dev`, once the integration is wired up).
2. Obtain an OAuth2 access token from the client ID/secret:
   ```bash
   curl -s https://api-m.sandbox.paypal.com/v1/oauth2/token \
     -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
     -d grant_type=client_credentials
   ```
3. Create an order (sponsorship checkout) with `return_url` =
   `PAYPAL_RETURN_URL` and `cancel_url` = `PAYPAL_CANCEL_URL`:
   ```bash
   curl -s https://api-m.sandbox.paypal.com/v2/checkout/orders \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "intent": "CAPTURE",
       "purchase_units": [{
         "description": "HackOS sponsorship",
         "amount": { "currency_code": "USD", "value": "500.00" }
       }],
       "application_context": {
         "return_url": "http://localhost:3000/payments/paypal/success",
         "cancel_url": "http://localhost:3000/payments/paypal/cancel"
       }
     }'
   ```
4. Follow the `approve` link returned in the order response to reach the
   sandbox checkout page.

## 4. Complete payment as the buyer

1. Open the `approve` link from the order response.
2. Log in with the **personal (buyer)** sandbox account
   (`PAYPAL_SANDBOX_BUYER_EMAIL`); the password is in the credential CSV.
3. Approve the payment. PayPal redirects to `PAYPAL_RETURN_URL`
   (`/payments/paypal/success`) with the order token.
4. Capture the order to finalize:
   ```bash
   curl -s -X POST \
     https://api-m.sandbox.paypal.com/v2/checkout/orders/<ORDER_ID>/capture \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json"
   ```
5. Verify the funds landed in the **business** sandbox account at
   <https://www.sandbox.paypal.com>.

Cancelling instead redirects to `PAYPAL_CANCEL_URL` (`/payments/paypal/cancel`).

## 5. Test webhook handling

1. In the developer dashboard, open your sandbox REST app and add a webhook.
   For local testing, expose your dev server with a tunnel (e.g. `ngrok http 3000`)
   and point the webhook URL at `https://<tunnel>/payments/paypal/webhook`.
2. Subscribe to events such as `CHECKOUT.ORDER.APPROVED`,
   `PAYMENT.CAPTURE.COMPLETED`, and `PAYMENT.CAPTURE.DENIED`.
3. Copy the generated **Webhook ID** and update `.env.local`:
   ```
   PAYPAL_WEBHOOK_ID=<your_webhook_id>
   ```
   (The setup script seeds this as `placeholder_for_now`.)
4. Use the dashboard's **Webhooks simulator** to send sample events, or run a
   real sandbox payment to trigger live deliveries.
5. The handler should verify each event with
   `POST /v1/notifications/verify-webhook-signature` using `PAYPAL_WEBHOOK_ID`
   before trusting it.

## 6. Switch from sandbox to live later

When ready for production:

1. Create a **live** REST app at
   <https://developer.paypal.com/dashboard/applications/live> and obtain live
   `client_id` / `client_secret`.
2. In the production environment (not committed to the repo), set:
   ```
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=<live_client_id>
   PAYPAL_CLIENT_SECRET=<live_client_secret>
   PAYPAL_BUSINESS_EMAIL=<live_business_email>
   PAYPAL_WEBHOOK_ID=<live_webhook_id>
   PAYPAL_RETURN_URL=https://<your-domain>/payments/paypal/success
   PAYPAL_CANCEL_URL=https://<your-domain>/payments/paypal/cancel
   ```
3. The integration should select the base URL from `PAYPAL_MODE`:
   - `sandbox` → `https://api-m.sandbox.paypal.com`
   - `live` → `https://api-m.paypal.com`
4. Create a fresh live webhook and update `PAYPAL_WEBHOOK_ID`. Remove
   `PAYPAL_SANDBOX_BUYER_EMAIL` (sandbox-only).
5. Store live secrets in your hosting provider's secret manager, never in the repo.

## Security checklist

- The credential CSV, `.env`, `.env.local`, and `.env.*.local` are gitignored.
- The setup script never prints the client secret or passwords.
- Only `.env.example` (placeholders) is committed.
- If a sandbox credential leaks, rotate it in the developer dashboard.
