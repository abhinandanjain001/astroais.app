# Astrois

Premium astrology web app, deployed at https://astroais.app.

## Features

- Firebase sign-in and personal birth details
- Calculated personal kundli with image download
- Multilingual AI astrology chat through OpenRouter
- Free daily practical advice and checkable goals
- Razorpay checkout and server-side payment verification
- ₹5 chat pass, ₹199 day pass, ₹1,999 30-day pass

## Development

Requires Node.js 22.13 or later.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Fill in server environment variables using your own credentials. Never commit secrets. Firebase public configuration is in `lib/firebase.ts`.

```sh
npm run build
npm start
```

## Deployment

Import this repository into Vercel as a Next.js project. Configure server environment variables in Vercel, then deploy. The existing production project already has its environment variables configured. See `PAYMENTS.md` and `CHAT-OPERATIONS.md` for backend details.

Daily goals are saved per user/profile/day on the current browser. Practical reflections are not guaranteed predictions.
