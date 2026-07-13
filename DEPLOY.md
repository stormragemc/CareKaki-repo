# Deploying CareKaki / AiMao

The repo is **deploy-ready**: the frontend reads its backend URL from
`NEXT_PUBLIC_API_BASE` (falls back to `localhost:8000` locally), and the backend's
CORS is configurable via `FRONTEND_ORIGINS`. You run two pieces:

- **Frontend** (Next.js) → **Vercel** (free, no card)
- **Backend** (FastAPI) → **Render** (free tier, Docker)

> ⚠️ **Before you make it public:** the backend runs on **your** OpenAI + ElevenLabs
> keys. Anyone who opens the link and chats will spend your credits. Keep the URL
> semi-private, set spend limits on your OpenAI account, and expect ElevenLabs voice
> to stop once its free characters run out (the app still works without voice).

---

## 1. Deploy the backend (Render)

1. Push this repo to GitHub (if it isn't already).
2. Go to **render.com** → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (it auto-detects `backend/Dockerfile`)
   - **Instance type:** Free
4. **Environment variables** (Advanced → Add):
   ```
   OPENAI_API_KEY       = sk-...            (required for chat/plan/voice script)
   ELEVENLABS_API_KEY   = sk_...            (optional — voice; omit to skip)
   ELEVENLABS_VOICE_ID  = 34Zg1FRU21oJb16YAlzk
   ELEVENLABS_MODEL_ID  = eleven_multilingual_v2
   OPENFDA_API_TOKEN    = ...               (optional — medication enrichment)
   FRONTEND_ORIGINS     = *                 (set to your Vercel URL after step 2)
   ```
   > Telegram (`TELEGRAM_BOT_TOKEN`, `ICCP_BOT_TELEGRAM_TOKEN`, `PUBLIC_BASE_URL`)
   > only matters if you want the live bot alerts. For a public web demo you can
   > leave them out — the panels still render; they just won't push to a phone.
5. Deploy. Copy the service URL, e.g. `https://carekaki-backend.onrender.com`.
   Open it in a browser — you should see `{"status":"Backend running"}`.

> Render's free tier sleeps after ~15 min idle; the first request then takes
> ~30–50s to wake. Fine for a demo — just click once and wait on the first load.

## 2. Deploy the frontend (Vercel)

1. Go to **vercel.com** → **Add New** → **Project** → import the same repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default.
3. **Environment variable:**
   ```
   NEXT_PUBLIC_API_BASE = https://carekaki-backend.onrender.com   (your step-1 URL)
   ```
4. Deploy. You'll get a link like `https://carekaki.vercel.app` — **that's your shareable URL.**

## 3. Close the CORS loop

Back on Render, set `FRONTEND_ORIGINS` to your exact Vercel URL (e.g.
`https://carekaki.vercel.app`) instead of `*`, and redeploy the backend. Done.

---

## Local dev is unchanged

No env vars set → frontend still talks to `http://localhost:8000`, backend still
allows `localhost:3000`. `docker compose up` and `npm run dev` work exactly as before.
