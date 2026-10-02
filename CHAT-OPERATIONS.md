# Live chat

Server secret: `OPENROUTER_API_KEY`. No browser key is required. Chat session signing uses `CHAT_SESSION_SECRET` if set, otherwise the existing server payment secret. Set secrets through Sites runtime environment settings and redeploy.

Routing order: `qwen/qwen3.8-27b:free`, then `google/gemma-4-31b-it:free`, then `openrouter/free`. Each request enforces zero input/output token pricing and permits provider fallbacks. One application attempt per model, with an 18-second timeout. No paid fallback is configured. Account authentication, quota and privacy errors stop further attempts. Content refusals do not trigger model switching.

Free-model availability changes. Check https://openrouter.ai/api/v1/models and https://openrouter.ai/docs/api/reference/limits when updating the pool. Model switching does not bypass account request quotas. Free inference is not an uptime guarantee for a busy paid service.

The 12-request/minute burst guard is per IP and Worker instance; it is not a globally durable rate limiter. Trial expiry and purchased passes remain browser-scoped signed cookies, not Firebase account entitlements. Clearing cookies or changing devices can obtain another trial. For high traffic, add durable per-user quota accounting and edge rate limits before advertising assured capacity.

Firebase Authentication (`astroais`) provides email/password registration, login, Google popup login, password reset and sign-out. Its web configuration is public and requires no server secret. POST /api/chat verifies Firebase RS256 ID tokens against Google's cached public keys, checks issuer, audience and timestamps, and rejects unauthenticated calls before AI invocation. Standard ID token verification does not check revocation; an already-issued token can remain valid for up to one hour. No service-account key is deployed. Authorized domains include astroais.app and astrois-intelligence.abhijain17825.chatgpt.site. Firebase owns account credentials; conversations and birth details are not written to Firebase. Signing out clears in-memory readings. Analytics is not initialized.

Conversation history stays in browser memory and the most recent bounded history is sent to OpenRouter with first name and calculated chart context. There is no application database of conversations. OpenRouter and selected providers have their own retention policies. Birth positions are geocentric tropical positions from Astronomy Engine, with timezone inferred by tz-lookup and Luxon. District selection and historical timezone boundaries limit precision. No Vedic kundli, houses, ascendant, dashas or exact event prediction is implemented.

Validation: `node --test tests/chat.test.mjs tests/payments.test.mjs`, `npx tsc --noEmit`, `npm run build`.

## Local astrology fallback

When free AI endpoints fail, exhaust quota, rate-limit, or exceed the 24-second retry budget, chat returns a shorter rule-based response from the freshly calculated birth chart. Replies include `source: astrology-engine` and tell users that local mode is active. Natal placements, current daily factors, and topic-specific timing windows come from Astronomy Engine calculations; the fallback does not invent event dates. Existing authentication, trial/pass expiry, validation, and application anti-abuse limits remain in force. Local mode needs the session-signing secret but does not require an AI key. AI content refusals are preserved.

Run coverage with `node --experimental-strip-types --test tests/astrology-fallback.test.mjs tests/firebase-auth.test.mjs`.
