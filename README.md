This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Running with Docker

Copy `.env.example` to `.env` in the repo root and fill in any keys you have (all are
optional — the stack boots on synthetic data when blank), then:

```bash
# Web + backend only (demo mode, no Telegram)
docker compose up --build
```

- Web → http://localhost:3000
- Backend → http://localhost:8000

### Live Telegram bot (auto ngrok + webhook)

The Telegram webhooks need a public HTTPS URL pointing at the backend. The `webhook`
profile starts an [ngrok](https://ngrok.com) tunnel and the backend automatically
registers both bots' webhooks (`/telegram/webhook` and `/iccp/webhook`) on startup —
no manual `setWebhook`/"connect link" step.

1. In the root `.env`, set:
   - `NGROK_AUTHTOKEN` — from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
   - `NGROK_DOMAIN` — a reserved [static domain](https://dashboard.ngrok.com/domains), host only (e.g. `gone-target-smugness.ngrok-free.dev`)
   - `PUBLIC_BASE_URL` — the full URL, e.g. `https://gone-target-smugness.ngrok-free.dev`
   - plus `TELEGRAM_BOT_TOKEN` / `ICCP_BOT_TELEGRAM_TOKEN`
2. Start everything (web + backend + ngrok):

```bash
docker compose --profile webhook up --build
```

The ngrok request inspector is available at http://localhost:4040. Verify Telegram can
reach the backend with:

```bash
curl -s "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo" | python3 -m json.tool
# expect "pending_update_count": 0 and no "last_error_message"
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
