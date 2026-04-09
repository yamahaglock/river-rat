# River Rat

At-a-glance Colorado River flow levels for water sports near Parker Dam, AZ. Shows whether it's a good time to take out the jet skis based on real-time dam release data from the U.S. Bureau of Reclamation.

## Quick Start

```bash
cd app
npm install
npm run fetch-data   # pull latest flow data from USBR (requires: brew install poppler)
npm run dev          # http://localhost:5173
```

## What It Does

- Fetches and parses the [Headgate Rock Dam Powerplant Report](https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf) (PDF)
- Shows hourly Parker Flow (CFS) with a threshold of 8,000 CFS for water sports
- Accounts for 1-hour downstream delay to the river house
- Trailing caution logic: 1st hour after flow drops = Slight Caution, 2nd hour = Extreme Caution
- Current weather from Open-Meteo (no API key needed)
- Jet ski windows filtered to daylight hours (sunrise/sunset)
- Dark mode with system preference detection
- PWA — installable on iOS/Android home screens

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run fetch-data` | Fetch latest PDF and parse flow data |
| `npm test` | Run Playwright E2E tests (34 tests) |
| `npm run test:ui` | Playwright interactive UI |

## Tech Stack

React 19, Vite 8, TypeScript, Tailwind CSS v4, Recharts, Playwright

## Project Docs

- [PLAN.md](PLAN.md) — full project plan, architecture, and implementation status
- [PROMPTS.md](PROMPTS.md) — all prompts used to build this project
