# Blackjack Dictionary

Learn blackjack basic strategy and card counting, then practice it.

**Live:** https://blackjack.sawyerpham.dev

## Features

- **Simulator** – customizable rules, optimal-play hints, realistic casino mode, NPC players
- **Guides** – basic strategy chart plus Hi-Lo, KO, Hi-Opt 2, Omega 2, Zen, and Wong Halves
- **Calculator** and **daily challenge**

## Run locally

```sh
pip install -r backend/requirements.txt
cd backend && uvicorn app:app --port 8000   # EV math API (Python)
npm install && npm run dev                  # frontend, proxies /api to :8000
```

Deploy: `docker compose up -d --build` (see `compose.yml`).

Built with React, TypeScript, Vite, Tailwind, and a FastAPI backend for the EV math.
