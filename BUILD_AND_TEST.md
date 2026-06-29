# Build & Test

**Stack:** TypeScript + Vite + Tone.js — browser wavetable synth driven by CGM CSV data.

## Prerequisites

Node.js 18+ and npm.

## Setup

```bash
npm install
```

## Build

```bash
npm run build
```

Runs `tsc && vite build` and outputs to `dist/`.

## Run

```bash
npm run dev
```

Dev server at http://localhost:5173

```bash
npm run preview
```

Preview the production build locally.

## Test

No automated tests. Load a sample LibreView CSV in the browser and verify audio output manually.
