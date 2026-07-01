# Paidviewer Web

Frontend repository for Paidviewer dashboard and OBS pages.

The Vercel project root should be set to `frontend`.

## Vercel Settings

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

## Production Env

Set these in Vercel:

```env
VITE_BOT_SERVICE_URL=https://api.example.com
VITE_BOT_SERVICE_WS_URL=wss://api.example.com
VITE_FRONTEND_URL=https://app.example.com
VITE_LOCAL_TTS_AGENT_URL=
```

Use the same root domain for app and API when possible, for example:

- app: `https://app.example.com`
- api: `https://api.example.com`

## Local Development

```powershell
cd frontend
npm install
npm run dev
```

Local Vite dev proxies `/api` and `/ws` to `http://localhost:8000`.

## Update

Push to `main`. Vercel deploys automatically.
