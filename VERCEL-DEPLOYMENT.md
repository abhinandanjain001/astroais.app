# Astrois on Vercel

Production URL: https://astrois-vercel.vercel.app

Project: https://vercel.com/abhinandan-jains-projects/astrois-vercel

This checkout uses Next.js on Vercel for the page and all six API routes. The original Cloudflare checkout is kept separately in `../astrois-openrouter`.

## Server configuration

These variables are saved as Secrets in the Vercel project's Production environment:

- `RAZORPAY_KEY_ID`: live-mode identifier from the same Razorpay account as the secret.
- `RAZORPAY_KEY_SECRET`: matching live-mode secret. Store as a Secret.
- `OPENROUTER_API_KEY`: the OpenRouter account's API key. Store as a Secret.
- `CHAT_SESSION_SECRET`: random signing secret; already generated and stored securely in Vercel.

No secret uses `NEXT_PUBLIC_` or appears in the frontend bundle. The owner supplied a new matching live Razorpay key pair for this deployment. The Firebase web configuration is public and remains in `lib/firebase.ts`.

The configured production deployment is `dpl_7XzY4SP3xKK2GotCi3jpVRC8R3gH` (Ready). Production checks returned 200 for payment status with live mode, created a ₹5 INR order, rejected a fabricated signature with 400, and reported chat configuration available. No real payment capture was performed during these checks.

## Verification

`npm run build` builds the frontend and backend. `node --test tests/payments.test.mjs tests/chat.test.mjs tests/firebase-auth.test.mjs` checks pricing, signature validation, captured-payment verification, identity validation, and free-model fallback.

On the live deployment, `/api/payment-status` should return 200 and `test_mode: false` with live credentials. `/api/chat` should report `available: true`. Start the ₹5 checkout from the website; payment verification grants access only after both a valid signature and captured Razorpay payment are confirmed. Actual purchases must be completed by the user.

Firebase Authentication authorizes `astrois-vercel.vercel.app`. The custom domain `astroais.app` remains on Cloudflare until Vercel's payment and chat secrets are configured and the migration is ready for DNS changes.

Purchased passes and trials remain scoped to the browser, not stored in Firebase. Old signed cookies do not migrate across hostnames. This Vercel project was deployed using the CLI and does not yet have automatic Git deployments configured.
