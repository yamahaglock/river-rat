# Colorado River Levels - Project Plan

## Overview

A React web application that shows at-a-glance water flow levels on the Colorado River below Parker Dam (near Parker, AZ). The primary use case is determining whether conditions are good for jet skiing and water sports near a river house approximately one hour downstream from the dam, on the California side.

---

## How to Run

```bash
cd projects/colorado-river-levels/app

# Install dependencies
npm install

# Fetch real flow data from USBR (requires: brew install poppler)
npm run fetch-data

# Start dev server (http://localhost:5173)
npm run dev

# Production build + preview
npm run build
npm run preview

# Run E2E tests (builds first, then runs Playwright against preview server)
npm test

# Interactive Playwright test UI
npm run test:ui
```

---

## Data Source

**PDF**: [Headgate Rock Dam Powerplant Report](https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf)

- Published by the U.S. Bureau of Reclamation
- Updated continuously each day
- Contains **hourly flow data** for the next 1-2 days (tomorrow, sometimes day after)
- Does **not** retain previous days — once the day passes, the data is gone from the PDF
- Timezone in PDF: **Mountain Standard Time (MST)** — Arizona does not observe DST

### PDF Structure (observed 2026-04-07)

| Column | Description |
|--------|-------------|
| HR | Hour of the day (1-24) |
| **PARKER FLOW** | **Total flow in CFS — this is our target column** |
| CRIT FLOW | CRIT (Colorado River Indian Tribes) diversion flow |
| GATE FLOW | Water released through gates |
| GENERATOR FLOW | Water flowing through generators |
| MWH | Megawatt-hours generated |

Bottom row: `Avg/Sum` — daily averages/totals.

Footer includes disclaimer about MST and a publication timestamp.

---

## Requirements

### Core Rules

1. **Good flow threshold**: Parker Flow >= **8,000 CFS** = good for water sports
2. **One-hour delay**: The river house is ~1 hour downstream from the dam. If flow is increasing, it takes about an hour for that level to reach the house. Apply a 1-hour offset when showing "conditions at the river house."
3. **Trailing caution after flow drops** (observed 2026-04-08): When flow drops below the threshold after being good, the river doesn't go dry instantly. Residual flow keeps it rideable with increasing caution:
   - **1st hour below threshold**: "Slight Caution" — still rideable, watch for shallows
   - **2nd hour below threshold**: "Extreme Caution" — barely rideable, be very careful
   - **3rd+ hour below**: No go
   This is implemented in `computeHourlyRideStatus()` and reflected in the status indicator, jet ski windows, and hourly table with 4-level color coding (green/yellow/orange/red).
3. **Timezone conversion**: PDF data is in MST (UTC-7, year-round). The river house is in California on **Pacific Time** (PT — PST/PDT). Display all times in PT for the user.
   - During PDT (most of the year): PT = MST - 0 hours (PDT = UTC-7 = MST)
   - During PST (Nov-Mar): PT = MST - 1 hour (PST = UTC-8)
4. **Data retention**: Since the PDF only shows future/next-day data, we must archive each day's PDF (or its extracted data) to display the current day's actual flow and build a historical view.

### User-Facing Features

#### At-a-Glance Dashboard (Home Screen)
- **Current conditions indicator**: Large, prominent visual signal
  - **Green** ("Go!") — flow at the river house is currently >= 8,000 CFS
  - **Yellow** ("Rising/Falling") — flow is currently below threshold but will cross 8,000 CFS within the next 1-2 hours, or is above but dropping soon
  - **Red** ("Low Water") — flow is below 8,000 CFS and not expected to rise soon
- Show the **current hour's estimated flow at the river house** (with 1-hour lag applied) as a big number
- Show the **current hour's flow at the dam** for reference
- Brief text: "Good for jet skis!" / "Water is low" / "Rising — should be good by X:XX PM"

#### Daily Flow Chart
- Line/area chart showing the 24-hour flow profile for a given day
- X-axis: hours in PT (12 AM - 11 PM)
- Y-axis: flow in CFS
- Horizontal reference line at **8,000 CFS** (the "good" threshold)
- Two lines/series:
  1. **Dam release** (raw Parker Flow from PDF)
  2. **At river house** (same data shifted +1 hour)
- Color the area above 8,000 CFS green, below red/orange
- Tooltip on hover showing exact CFS and time

#### Jet Ski Windows
- Only show windows during **daylight hours** — sunrise/sunset times fetched from the Open-Meteo weather API per day
- Falls back to 6 AM – 7 PM if weather data is unavailable
- Displays sunrise and sunset times in the card footer

#### Day Navigation
- Ability to scroll/swipe through available days (all days we have archived data for)
- Date picker or left/right arrows
- "Today" button to jump back to current day
- Label each day clearly (e.g., "Monday, April 7, 2026")
- **Default date**: Shows today if available; otherwise the closest available date, preferring past over future

#### Tomorrow's Forecast
- When tomorrow's data is available in the PDF, show it with a "Forecast" label
- Same chart format as historical days
- Highlight the good windows: "Jet ski window: 6 PM - 11 PM"

#### Weather
- Show current weather conditions for the Parker, AZ / river house area alongside the flow data
- Temperature (high/low and current), conditions (sunny, cloudy, etc.), wind speed, and humidity
- Use a free weather API (e.g., Open-Meteo — no API key required, or OpenWeatherMap free tier)
- Display weather prominently on the dashboard near the flow indicator — when it's 115F and sunny with good flow, that's a perfect river day
- Show a simple multi-day weather forecast alongside flow data when navigating between days

#### Dark Mode (Implemented)
- Toggle button in the header (moon/sun icon) switches between light and dark themes
- Preference persisted in `localStorage` — survives page reloads
- Defaults to system preference (`prefers-color-scheme: dark`) if no stored preference
- Dark palette: deep navy background (`#0F1419`), blue-gray cards (`#1E2A3A`), muted borders (`#2A3A4E`)
- All components adapted: status indicators, charts (grid lines, ticks, tooltips), weather card, day navigator, hourly table, jet ski windows, loading/error states, footer
- Recharts colors adapt via a `useSyncExternalStore` hook that watches the `.dark` class on `<html>`

### Nice-to-Have / Phase 2
- Weekly summary view (bar chart showing hours above 8,000 CFS per day)
- Push notifications when flow is about to cross the threshold

---

## Responsive Design & PWA

### Mobile-First Design
- **Mobile is the primary experience** — most users will check flow on their phone while at or heading to the river house
- Touch-friendly: swipe between days, large tap targets for navigation
- Dashboard cards stack vertically on mobile, side-by-side on desktop
- Charts scale responsively — simplified tooltips on mobile (tap instead of hover)
- Bottom navigation bar on mobile for quick access to: Dashboard, Charts, Forecast

### Desktop
- Wider layout with dashboard and chart visible simultaneously
- Side panel for day navigation and weather
- Hover tooltips on charts with detailed data

### PWA / iOS Web App (Implemented)
- Full PWA support:
  - `manifest.json` with app name, theme color, display mode `standalone`
  - Service worker for offline caching of previously viewed data (via vite-plugin-pwa / Workbox)
  - Proper `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` meta tags
- **App icon** (implemented): Custom designed icon rendered from SVG (`icons/icon-source.svg`)
  - Teal sky gradient background with golden sun
  - Desert mesa silhouette in deep teal layers
  - River water with wave highlights
  - Jet ski silhouette on the water
  - "RIVER RAT" text at bottom
  - Generated at 512x512, 192x192, and 180x180 (apple-touch-icon) PNG
  - Rounded corners per iOS conventions (built into SVG `rx="96"`)
- **iOS safe areas** (implemented): Header uses `env(safe-area-inset-top)` to clear the Face ID notch/Dynamic Island in standalone mode. Dashboard bottom uses `env(safe-area-inset-bottom)` for the home indicator bar. Viewport set to `viewport-fit=cover`.

---

## Visual Theme & Branding

### App Name
- Working title: **"River Rat"** (or similar — short, fun, easy to remember on a home screen)

### Theme Concept: Desert River Oasis
The visual identity blends the hot desert environment with the lush, fun river lifestyle. Think: warm sand tones meeting cool river blues, with playful nods to river house life.

### Color Palette
| Role | Color | Inspiration |
|------|-------|-------------|
| Primary | Teal/river blue (`#0891B2` range) | Cool Colorado River water |
| Secondary | Warm sand/amber (`#D97706` range) | Desert sand and sun |
| Accent/Good | Vibrant green (`#16A34A`) | Lush riverside vegetation, "go" indicator |
| Accent/Low | Dusty red/terracotta (`#DC2626`) | Desert rock, "low water" warning |
| Background | Warm off-white (`#FDF8F0`) | Sun-bleached desert feel |
| Dark surfaces | Deep river blue (`#164E63`) | For cards, headers |

### Typography
- Headers: Bold, slightly rounded sans-serif (e.g., Nunito, Quicksand) — approachable and fun but still readable
- Body: Clean sans-serif (Inter, system font stack) — no-nonsense for data

### Visual Elements & Personality
- **Subtle desert/river textures**: Faint topographic contour lines or gentle wave patterns in backgrounds — not overwhelming, just enough to set the mood
- **Illustrated icons** (simple, flat style) for different features:
  - Jet ski icon for the "good to ride" indicator
  - Cactus or sun for weather section
  - Wave/water droplet for flow data
  - Inner tube, wakeboard, or golf cart for fun section headers
- **Status animations**: When flow is good, a subtle animated water shimmer or wave effect on the status card. When low, a dry/still desert feel.
- **Fun micro-copy throughout**:
  - Good flow: "Send it!" / "River's pumping!" / "Good to ride"
  - Low flow: "Desert mode" / "Better grab the golf cart" / "Snack time"
  - Rising: "Water's coming... grab your gear"
- **Desert wildlife Easter eggs** (subtle): Tiny scorpion, frog, or snake illustrations tucked into corners or loading states — fun to discover, not distracting
- **Photo-ready**: Consider a hero area or background that could optionally show a user-uploaded river/desert photo

### Tone
Professional enough to trust the data, fun enough that it feels like the river house vibe. This is a weekend/vacation app — it should put you in a good mood when you open it.

---

## Architecture

### Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 19 + Vite 8 + TypeScript | Done |
| Styling | Tailwind CSS v4 | Done |
| Charts | Recharts 3 | Done |
| PDF Parsing | `pdftotext` (poppler) via Node script | Done |
| Weather API | Open-Meteo (free, no API key needed) | Done |
| PWA | vite-plugin-pwa (Workbox) | Done |
| E2E Testing | Playwright (Chromium) | Done |
| Backend/API | Vercel serverless functions (scaffolded) | Scaffolded |
| Data Storage | Static JSON files in `public/data/` | Done |
| Hosting | Vercel (with cron for PDF fetching) | Not deployed |

### Data Pipeline (Implemented)

**Local script**: `scripts/fetch-pdf.ts` (run via `npm run fetch-data`)
1. Fetches the live PDF from USBR
2. Archives the raw PDF to `pdfs/` with timestamp
3. Extracts text using `pdftotext` (poppler — `brew install poppler`)
4. Parses all days present in the PDF (typically 2-4 days)
5. Writes per-day JSON files to `public/data/YYYY-MM-DD.json`
6. Updates `public/data/index.json` with the list of available dates
7. Never overwrites past days with empty data

The frontend reads directly from the static `/data/*.json` files — no API server needed for basic operation.

**Production automation (not yet deployed)**: Vercel serverless functions are scaffolded in `api/`:
- `api/fetch-flows.ts` — cron-triggered PDF fetcher/parser (every 30 min via `vercel.json`)
- `api/flows.ts` — serves archived flow data via REST

### Data Model

```
// Per-day data file: data/2026-04-07.json
{
  "date": "2026-04-07",
  "dayOfWeek": "Monday",
  "fetchedAt": "2026-04-07T13:26:00-07:00",
  "source": "HeadgateReport.pdf",
  "hours": [
    {
      "hour": 1,          // 1-24, MST (as in PDF)
      "hourPT": 0,        // Converted to PT (0-23, 0 = midnight)
      "parkerFlow": 14021, // CFS
      "critFlow": 950,
      "gateFlow": 0,
      "generatorFlow": 13071,
      "mwh": 15.07
    },
    // ... hours 2-24
  ],
  "dailyAverage": 10081
}
```

### PDF Parsing Logic (Implemented in `scripts/fetch-pdf.ts`)

1. Fetch PDF as binary from the USBR URL
2. Archive raw PDF to `pdfs/` with ISO timestamp filename
3. Extract text via `pdftotext -layout` (preserves column alignment)
4. Split text by "Headgate Rock Dam Powerplant Report" header to get each day's section
5. Parse the date from each section (e.g., "Wednesday, April 8, 2026")
6. For each row, split by whitespace and extract:
   - HR (column 1, validated 1-24)
   - PARKER FLOW (column 2) — **this is the key value**
   - CRIT FLOW, GATE FLOW, GENERATOR FLOW, MWH (remaining columns)
7. Calculate daily average from parsed hours
8. Write one JSON file per date, plus an `index.json` listing all available dates
9. Handles multi-day PDFs (tested with 4 pages/days from a single PDF)

### Timezone Handling

- PDF times are in MST (UTC-7, always — Arizona doesn't do DST)
- River house is in California (Pacific Time)
  - PDT (second Sunday in March to first Sunday in November): UTC-7 — **same as MST**
  - PST (first Sunday in November to second Sunday in March): UTC-8 — **MST minus 1 hour**
- Use a library like `date-fns-tz` or `luxon` to handle conversions properly
- Always display times to the user in PT
- The 1-hour river delay is applied on top of the timezone conversion

### Archival Strategy

- **Raw PDFs**: Save every fetched PDF as `pdfs/YYYY-MM-DD_HHMM.pdf` (timestamped by fetch time). This preserves the original source of truth and allows re-parsing if the extraction logic is ever updated. PDFs are ~187KB each; even fetching every 30 minutes that's only ~9MB/day, trivially small.
- **Parsed JSON**: Store one JSON file per date (`data/YYYY-MM-DD.json`). The cron job checks the PDF, extracts all dates present, and writes/updates the corresponding JSON files.
- Never overwrite a past day's parsed data with empty data (the PDF drops past days)
- Keep both raw PDFs and parsed JSON indefinitely — the goal is a complete historical record from project launch onward

---

## Component Breakdown

```
app/
  scripts/
    fetch-pdf.ts             # Node script: fetches real PDF, parses, writes JSON
  api/
    fetch-flows.ts           # Vercel serverless: cron-triggered PDF fetcher (scaffolded)
    flows.ts                 # Vercel serverless: serves flow data (scaffolded)
  pdfs/                      # Archived raw PDFs (timestamped, from fetch-pdf.ts)
  public/
    data/                    # Parsed flow JSON files (from fetch-pdf.ts)
      index.json             # List of available dates
      YYYY-MM-DD.json        # Per-day flow data
    icons/
      favicon.svg            # SVG favicon (desert river icon)
      icon-192.png           # PWA icon (192x192)
      icon-512.png           # PWA icon (512x512)
      apple-touch-icon.png   # iOS home screen icon (180x180)
  e2e/
    dashboard.spec.ts        # Playwright E2E tests (26 tests)
  src/
    components/
      Dashboard.tsx          # Main at-a-glance view (orchestrates all cards)
      FlowIndicator.tsx      # Green/yellow/red status indicator with animations
      WeatherCard.tsx        # Current weather + 5-day forecast (Open-Meteo)
      FlowChart.tsx          # Recharts 24-hour area chart with threshold line
      DayNavigator.tsx       # Prev/next arrows + date display
      HourlyTable.tsx        # Expandable hourly breakdown table
      JetSkiWindow.tsx       # Shows time windows above 10k CFS threshold
      Header.tsx             # "River Rat" branding header + dark mode toggle
    hooks/
      useFlowData.ts         # Fetches flow data from static /data/ JSON files
      useCurrentConditions.ts # Derives current status with 1-hr downstream lag
      useWeather.ts          # Fetches weather from Open-Meteo API
      useDarkMode.ts         # Dark mode toggle with localStorage + system pref
    utils/
      timezone.ts            # MST to PT conversion, hour formatting
      thresholds.ts          # 8,000 CFS constant, river delay, Parker coordinates
      formatters.ts          # CFS, date, and temperature formatting
      microcopy.ts           # Fun status messages ("Send it!", "Desert mode", etc.)
    types/
      flow.ts                # TypeScript interfaces for flow data
      weather.ts             # Weather API types + WMO weather code descriptions
    App.tsx
    main.tsx
    index.css                # Tailwind v4 + light/dark theme (desert river oasis palette)
  playwright.config.ts       # Playwright config (Chromium, preview server)
  vite.config.ts             # Vite + Tailwind + PWA plugin
  vercel.json                # Vercel cron config for PDF fetcher
```

---

## Implementation Phases

### Phase 1: Core MVP — DONE
1. ~~Set up React 19 + Vite 8 + Tailwind v4 project with desert-river theme~~ Done
2. ~~Build the PDF parser (`scripts/fetch-pdf.ts` using pdftotext)~~ Done
3. ~~PDF fetching, raw PDF archival to `pdfs/`, and JSON data extraction to `public/data/`~~ Done
4. ~~PWA setup: manifest, service worker, iOS meta tags, SVG favicon, placeholder icons~~ Done
5. ~~Mobile-first responsive layout (stacking cards on mobile, 3-col grid on desktop)~~ Done
6. ~~At-a-glance status indicator (green/yellow/red) with fun micro-copy~~ Done
7. ~~Current flow at dam and estimated flow at river house (with 1-hr lag)~~ Done
8. ~~Daily flow chart with 8,000 CFS threshold line, "Now" indicator, dam + house series~~ Done
9. ~~Weather integration via Open-Meteo (current + 5-day forecast, no API key)~~ Done
10. ~~Day navigation (prev/next arrows) for available dates~~ Done
11. ~~Jet ski time windows — shows hours when flow is good at the river house~~ Done
12. ~~Expandable hourly breakdown table~~ Done
13. ~~Jet ski windows filtered to daylight hours only (sunrise/sunset from weather API)~~ Done
14. ~~Default date selection: closest available date, not latest~~ Done
15. ~~Dark mode with toggle, localStorage persistence, system preference default~~ Done
16. ~~Trailing caution logic: 1st hr below = Slight Caution, 2nd hr = Extreme Caution~~ Done
17. ~~Custom app icon (desert river scene with jet ski, generated from SVG at 3 sizes)~~ Done
18. ~~iOS safe area insets for Face ID notch and home indicator bar~~ Done
19. ~~Playwright E2E tests (33 tests covering all components + dark mode + caution)~~ Done
20. Deploy to Vercel/Netlify — **not yet done**
21. Wire up Vercel cron to auto-fetch PDF every 30 min — **not yet done** (scaffolded in `api/`)

### Phase 2: Polish
22. Weekly summary bar chart
23. Illustrated icons (jet ski, cactus, wave, etc.) and desert wildlife Easter eggs
24. Status animations (water shimmer for good flow, still desert for low)
25. Swipe gesture for day navigation on mobile

### Phase 3: Enhancements
26. Push notifications (web push API) for threshold crossings
27. Historical trends (average flow by day of week, etc.)
28. Optional user-uploaded river house photo as hero/background

---

## Key Decisions (Resolved)

1. **PDF parsing**: `pdftotext` (poppler CLI) — fast, accurate, no npm dependency headaches
2. **Chart library**: Recharts 3 — React-native, good area chart support
3. **Data pipeline**: Local Node script (`fetch-pdf.ts`) writes static JSON; Vercel serverless for production automation
4. **Data storage**: Static JSON files in `public/data/` + raw PDFs in `pdfs/`
5. **Testing**: Playwright E2E tests against the production build (`vite preview`)

### Still to decide
- **Hosting platform**: Vercel vs Netlify vs Cloudflare Pages (Vercel is scaffolded)
- **Production PDF fetching**: Run the cron via Vercel serverless, or GitHub Actions, or external scheduler?

---

## Reference

- PDF URL: https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf
- Contact for schedule questions: (702) 293-8373 or BCOOWaterOps@usbr.gov
- Flow threshold for water sports: **8,000 CFS**
- River house location: California side, ~1 hour downstream from Parker Dam
- All times displayed in **Pacific Time (PT)**
