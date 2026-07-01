# Paidviewer Web

Frontend-репозиторий Paidviewer: dashboard, OBS-страницы и пользовательский интерфейс.

В Vercel нужно выбрать root directory: `frontend`.

## Настройки Vercel

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

## Production Env

Добавить в Vercel:

```env
VITE_BOT_SERVICE_URL=https://api.example.com
VITE_BOT_SERVICE_WS_URL=wss://api.example.com
VITE_FRONTEND_URL=https://app.example.com
VITE_LOCAL_TTS_AGENT_URL=
```

По возможности используй один корневой домен для frontend и API:

- frontend: `https://app.example.com`
- API: `https://api.example.com`

## Локальная Разработка

```powershell
cd frontend
npm install
npm run dev
```

Локальный Vite dev proxy проксирует `/api` и `/ws` на `http://localhost:8000`.

## Обновление

Push в `main`. Vercel автоматически соберёт и выкатит новую версию.
