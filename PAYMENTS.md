# Razorpay checkout

This project uses React with Vinext (Next.js-compatible routes), Vite and Cloudflare Workers. The Razorpay SDK is installed. Server routes use Razorpay’s REST API through native Fetch for Cloudflare Workers compatibility. Credentials never enter client code.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and supply your Razorpay test key ID and secret. The current checkout already has an ignored `.env`. Never prefix the secret with `VITE_` or `NEXT_PUBLIC_`.
3. Run `npm run dev -- --host 127.0.0.1 --port 5173`.
4. Enter birth details, then choose the ₹5 chat pass or ₹199 Premium pass under Membership. Click Pay securely. Complete a test payment in Razorpay Checkout.
5. Confirm that the pass activates only after backend verification. Refresh in the same browser to check restoration. Dismiss checkout and try a failed test payment to check error messages.

The supplied keys are test keys: no real money moves. ₹5 buys five minutes; ₹199 buys 30 days. Standard Checkout makes one-time payments, not recurring subscriptions. Time starts at the gateway payment timestamp. Astrology responses are still clearly labelled sample guidance; this change does not add an AI model or personalized chart calculations.

## Routes

- `POST /api/create-order`: JSON `{ "plan": "pass" }` or `{ "plan": "premium" }`. Optional `amount` in paise and `currency` must match the server catalog (500/19900, INR). Values below 100 paise are rejected. Returns order ID, amount, currency, public key ID and a signed order token.
- `POST /api/verify-payment`: JSON containing `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`, and the `order_token` from create-order. Requires the same browser session and Origin. Verifies HMAC-SHA256 against the server-signed order, then fetches Razorpay order/payment records and checks price, currency, session and captured status. No signature match means no access.
- `GET /api/payment-status`: returns the current verified browser pass; never returns the secret.

Pending confirmations can be retried without charging again. Their details are kept in sessionStorage for recovery in the same tab. The access grant uses an HttpOnly, SameSite cookie (Secure over HTTPS). Replay cannot extend a pass. No database tables were added.

## Verification

- `node --test tests/payments.test.mjs` (Node 22.18+ or current Node 24/26): tests server pricing, malformed fields, altered signatures, wrong sessions, pending/failed/refunded payments, replay/expiry and gateway errors.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- `npm run build`

Use only payment methods/test credentials listed in Razorpay's current [Standard Checkout documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/). Do not enter live card details in this test app.

## Production settings and limitations

Set `RAZORPAY_KEY_ID` and secret `RAZORPAY_KEY_SECRET` in the hosting runtime, then deploy. Local `.env` is not published. Checkout receives the public key ID from the server, so the optional Vite public variable is not required. Never place the secret in hosting.json or client source.

Before taking real payments, activate the Razorpay account, configure automatic capture, replace the test credentials with live credentials. The pricing notice detects test mode automatically. Rotate the secret shared in chat before production. Complete a real deployment checkout test using test mode before switching keys.

Access is scoped to the current browser, not a permanent account. Clearing cookies loses access. There is no database entitlement ledger or webhook reconciliation: refunds after access was granted are not automatically revoked, cross-device restoration is not available, and the demo's client-side chat is not a secure metered AI service. Production AI requests should enforce the verified entitlement on the server; account-based purchases/refund handling need persistent entitlements and verified Razorpay webhooks.
