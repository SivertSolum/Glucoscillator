# Backlog: Libre Live Data Integration

**Status:** Draft  
**Created:** 2026-07-05  
**Related docs:** [Architecture](../architecture.md) · [LibreView CSV format](../libreview-format.md) · [Components](../components.md)

---

## Summary

Glukoscillator currently loads glucose data exclusively from **LibreView CSV exports** (drag-and-drop or bundled sample file). This backlog describes how to add **direct fetching from Abbott's Libre ecosystem** so users can skip manual CSV downloads and enable live features such as **"How do I sound today?"**

The recommended path for a personal/creative app is an **unofficial LibreLinkUp API integration** behind a **small backend proxy**, feeding the existing `ParsedLibreViewData` pipeline. Full historical archives should remain CSV-based for now.

---

## Problem statement

| Pain today | Desired outcome |
|------------|-----------------|
| User must log into LibreView, export CSV, and upload manually | One-time connect; app pulls recent data automatically |
| No access to today's curve until export | "How do I sound today" uses live or near-live readings |
| CSV workflow blocks casual daily use | Refresh button or periodic sync for current day |
| Browser app is fully local (privacy win) | Libre credentials cannot live in frontend code |

---

## Current application state

### Data flow (as implemented)

```
LibreView CSV Export → parseLibreViewCSV() → ParsedLibreViewData → generateAllWavetables() → UI / synth
```

Key files:

| File | Role |
|------|------|
| `src/parser/libreview.ts` | CSV parsing, unit detection, `groupReadingsByDay()`, stats |
| `src/main.ts` | File upload, sample load, wires data into mixer UI |
| `src/types.ts` | `GlucoseReading`, `DailyGlucoseData`, `ParsedLibreViewData` |
| `src/synthesis/wavetable.ts` | Glucose → 2048-sample wavetable + FFT |

### Internal data model (target for all sources)

```typescript
interface GlucoseReading {
  timestamp: Date;
  value: number;        // normalized to mg/dL internally
  recordType: number;   // 0 = automatic/historic, 1 = scan
}

interface ParsedLibreViewData {
  days: Map<string, DailyGlucoseData>;
  unit: 'mg/dL' | 'mmol/L';
  deviceName: string;
  serialNumber: string;
}
```

**Design principle:** Any new data source (API, Nightscout, etc.) should produce `GlucoseReading[]` or `ParsedLibreViewData` and reuse `generateAllWavetables()` — do not fork the synthesis path.

### Privacy posture today

From `docs/libreview-format.md`: *"Glukoscillator processes CSV files entirely in your browser. No glucose data is uploaded to any server."*

A Libre integration **changes this** unless the backend is **self-hosted locally**. This must be communicated clearly in UI and documentation.

---

## Goals and use cases

### Primary use cases

1. **Connect once, fetch recent data** — User links LibreLinkUp; app loads last ~12 hours to ~2 weeks without CSV.
2. **"How do I sound today?"** — One action: load today's readings, build wavetable, assign to OSC 1, ready to play.
3. **Periodic refresh** — Optional polling (e.g. every 5 minutes) to update today's wavetable as new readings arrive.
4. **Hybrid history** — API for recent days; CSV upload retained for months/years of archive.

### Non-goals (initial scope)

- Abbott official partner / whitelist API onboarding
- Multi-tenant hosted service storing many users' Libre credentials
- Medical device claims, alarms, or treatment decisions
- Replacing CSV entirely (API history depth is limited)

---

## Integration options (research)

### Option A: Official Libre Data Sharing API

**What it is:** Abbott's FDA-cleared (510(k) K223537) cloud API for Libre 2 and Libre 3. Transmits glucose values and alarms to **authorized client software**.

**Access model:** Whitelist only — third-party developers need **prior authorization from Abbott Diabetes Care**. Not a public developer portal.

**Typical users:** EHR systems (e.g. Epic integration, April 2025), RPM/clinical platforms (e.g. CCN Health via LibreView cloud API), commercial health aggregators (e.g. [Thryve](https://www.thryve.health/features/connections/abbott-freestyle-libre-integration)).

| Pros | Cons |
|------|------|
| Stable, supported, compliant | Not available for indie/personal projects |
| Real-time cloud sync | Legal, regulatory, and business development overhead |
| Suitable for commercial health products | Overkill for Glukoscillator |

**Backlog decision:** Defer unless Glukoscillator becomes a commercial health platform. Document as long-term / alternative path.

---

### Option B: Unofficial LibreLinkUp API (recommended)

**What it is:** Reverse-engineered HTTP API used by Abbott's **LibreLinkUp** follower app. Community-documented for #WeAreNotWaiting projects (LoopKit, GlucoseDirect, Nightscout bridges).

**Documentation and libraries:**

| Resource | URL | Notes |
|----------|-----|-------|
| LibreView Unofficial API (OpenAPI) | https://libreview-unofficial.stoplight.io/ | Community spec; not affiliated with Abbott |
| OpenAPI YAML | https://github.com/FokkeZB/libreview-unofficial | Generate clients |
| CORS proxy (dev reference) | https://libreview-proxy.onrender.com/ | Avoid CORS in experiments only |
| Node client | https://github.com/DRFR0ST/libre-link-unofficial-api | `login`, `read`, `history`, `stream` |
| Python client | https://github.com/robberwick/pylibrelinkup | `latest()`, `graph()`, `logbook()` |
| HTTP flow reference | https://gist.github.com/khskekec/6c13ba01b10d3018d816706a32ae8ab2 | Login → connections → graph |

**API data surfaces (approximate):**

| Method / endpoint concept | Coverage | Glukoscillator use |
|---------------------------|----------|-------------------|
| Latest / current reading | Single value + trend | Status indicator, partial today curve |
| Graph (`/llu/connections/{id}/graph`) | ~12 hours | **"How do I sound today"** (partial day) |
| Logbook | ~2 weeks of events | Day picker for recent history |
| LibreView CSV export | Full user history | Long-term archive (existing path) |

**Regional API hosts:** EU, US, and others — e.g. `api-eu.libreview.io`, `api-us.libreview.io`. Clients like `pylibrelinkup` expose region enums (`APIUrl.EU`, `APIUrl.US`, etc.).

**Authentication flow (conceptual):**

1. `POST /llu/auth/login` with LibreLinkUp email/password → JWT + user id
2. `GET /llu/connections` with auth headers → list of shared patients → `patientId`
3. `GET /llu/connections/{patientId}/graph` (and related) → glucose time series

**October 2025 breaking change (critical):**

Abbott updated LibreLinkUp API requirements around October 2025. Integrations without these changes return **403 Forbidden** with `minimumVersion: 4.16.0`:

- Request header `version`: **`4.16.0`** or higher (was ~4.7.0 / 4.12.0)
- Request header `Account-Id`: **SHA-256 hex hash of `user.id`** from login response
- Product identifier changes reported in community (e.g. `llu.android` vs `llu.ios` in some clients)
- Users may need to **accept updated Terms of Service** in the LibreLinkUp mobile app

References: [nightscout-connect PR #53](https://github.com/nightscout/nightscout-connect/pull/53), [DiaKEM issue #35](https://github.com/DiaKEM/libre-link-up-api-client/issues/35), [xDrip discussion #4203](https://github.com/NightscoutFoundation/xDrip/discussions/4203).

**LibreLinkUp account requirement:**

The API expects a **LibreLinkUp follower account**, not the primary FreeStyle Libre app login.

Setup for personal use (self-follow):

1. Create a **second email address**.
2. Register a **LibreLinkUp** account with that email (separate from FreeStyle Libre app account).
3. In the **FreeStyle Libre / Libre 3 app** → Connected Apps → LibreLinkUp → invite the follower email.
4. In **LibreLinkUp app** → accept invitation.
5. Use **LibreLinkUp credentials** (follower account) in the integration.

| Pros | Cons |
|------|------|
| Best fit for personal creative app | Unofficial; may violate Abbott ToS |
| Real-time-ish data for today | API can break when Abbott updates app |
| Mature community libraries | ~12h graph ≠ full day until enough readings |
| Enables "sound today" without CSV | Requires backend (CORS + secrets) |
| Logbook ~2 weeks for recent day compare | Not a substitute for full CSV history |

**Backlog decision:** **Primary implementation path.**

---

### Option C: Nightscout bridge

**What it is:** Run [Nightscout](https://nightscout.github.io/) with an uploader such as [nightscout-librelink-up](https://github.com/timoschlueter/nightscout-librelink-up). Glukoscillator reads Nightscout's standard REST API (`/api/v1/entries.json`, etc.).

| Pros | Cons |
|------|------|
| Decouples app from Abbott API churn | Requires VPS/Docker/Heroku-style hosting |
| Well-known JSON format in diabetes community | Extra ops burden for non-Nightscout users |
| Glukoscillator only talks to user's Nightscout URL + API secret | Still unofficial upstream (LibreLinkUp) |

**Backlog decision:** Optional **Phase 2** adapter for users who already run Nightscout. Lower priority than direct LibreLinkUp unless user base is heavily Nightscout-oriented.

---

### Option D: Commercial health API brokers

Examples: Thryve, Junction, Terra — OAuth-based access to Libre among 500+ sources.

| Pros | Cons |
|------|------|
| Handles auth, compliance, normalization | Paid; business relationship |
| Unified API across CGM vendors | Heavy for a personal art/synth project |

**Backlog decision:** Out of scope unless product direction shifts to commercial SaaS.

---

## Recommended architecture

### Why a backend is required

- LibreLinkUp API does not support browser CORS for third-party origins.
- User credentials must not be embedded in Vite frontend bundle or localStorage in plain text.
- Session tokens and refresh logic belong server-side.

### Target architecture

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│ FreeStyle Libre app │────▶│ LibreView / LibreLinkUp  │◀────│ Backend proxy       │
│ (sensor → phone)    │     │ cloud                    │     │ (Node or Python)    │
└─────────────────────┘     └──────────────────────────┘     └──────────┬──────────┘
                                                                        │
                                                                        │ JSON
                                                                        ▼
                                                             ┌─────────────────────┐
                                                             │ Glukoscillator      │
                                                             │ (browser)           │
                                                             │ libre-api adapter   │
                                                             │ → ParsedLibreView   │
                                                             │ → wavetables        │
                                                             └─────────────────────┘
```

### Deployment modes

| Mode | Description | Privacy |
|------|-------------|---------|
| **Local dev server** | Express/Fastify alongside `npm run dev` | Credentials stay on user's machine |
| **Self-hosted** | User runs Docker on NAS/RPi | Best for privacy-conscious users |
| **Serverless** | Vercel/Cloudflare Worker + encrypted session store | User must trust operator |
| **Hosted (future)** | Multi-user product | Requires strong security + legal review |

**Initial recommendation:** Local/self-hosted backend; document clearly. Avoid public hosted credential storage in v1.

### Proposed backend API (Glukoscillator-specific)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/libre/health` | GET | Backend alive, version |
| `/api/libre/connect` | POST | Body: `{ email, password, region? }` → establish session |
| `/api/libre/disconnect` | POST | Invalidate session |
| `/api/libre/status` | GET | Connected?, last sync, patient name |
| `/api/libre/today` | GET | Today's readings as JSON |
| `/api/libre/graph` | GET | ~12h graph (raw API shape or normalized) |
| `/api/libre/days` | GET | Recent days from logbook/history (~2 weeks) |
| `/api/libre/stream` | GET (SSE) or WebSocket | Optional: push updates every N minutes |

**Session storage:** In-memory for local dev; httpOnly cookie or server-side session id for production. Do not return Libre JWT to frontend.

### Proposed frontend modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| API client | `src/data/libre-client.ts` | Fetch from Glukoscillator backend |
| Response adapter | `src/parser/libre-api.ts` | API JSON → `GlucoseReading[]` → `ParsedLibreViewData` |
| Shared grouping | Refactor `groupReadingsByDay` in `libreview.ts` | Export for CSV + API reuse |
| Connect UI | `src/ui/libre-connect.ts` | Login form, region select, status, refresh |
| Main wiring | `src/main.ts` | Merge API load with existing CSV path |

### Data mapping (API → internal model)

Map LibreLinkUp graph/logbook entries to:

```typescript
{
  timestamp: new Date(apiEntry.timestamp),  // confirm field names per library
  value: normalizeToMgDl(apiEntry.value, unit),
  recordType: apiEntry.isScan ? 1 : 0,
}
```

Then:

```typescript
const days = groupReadingsByDay(readings);
const data: ParsedLibreViewData = {
  days,
  unit: 'mg/dL',
  deviceName: connection.device ?? 'FreeStyle Libre',
  serialNumber: connection.serial ?? '',
};
generateAllWavetables(data.days);
```

Unit conversion already exists in CSV parser (`mmol/L → mg/dL` factor `18.0182`); reuse same logic.

---

## Epics and user stories

### Epic 1: Foundation — parser refactor and adapter

**Goal:** Single code path from `GlucoseReading[]` to wavetables regardless of source.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L1-1 | Export shared `buildParsedDataFromReadings(readings, meta)` | CSV and API both use it; no duplicated grouping/stats logic |
| L1-2 | Add `parseLibreLinkUpGraph(response)` adapter | Unit tests with fixture JSON; outputs valid `GlucoseReading[]` |
| L1-3 | Add `parseLibreLinkUpLogbook(response)` adapter | Handles ~2 week event list |
| L1-4 | Normalize timestamps across API time zones | Today boundary matches user's locale or configurable TZ |

---

### Epic 2: Backend proxy (LibreLinkUp)

**Goal:** Secure server that talks to Abbott cloud and exposes Glukoscillator JSON API.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L2-1 | Scaffold `server/` package (Node + `libre-link-unofficial-api` OR Python + `pylibrelinkup`) | Runs on `localhost:3001`; documented in README |
| L2-2 | Implement login with region auto-detect or explicit `EU`/`US` | Returns session cookie; handles 403 with actionable error (ToS, version) |
| L2-3 | Implement `Account-Id` header (SHA-256 of user id) | Works against post–Oct 2025 API; version header ≥ 4.16.0 |
| L2-4 | Implement `GET /api/libre/today` and `GET /api/libre/days` | Returns normalized JSON matching adapter expectations |
| L2-5 | Session persistence for local dev | User reconnects once per server restart unless "remember me" opted in |
| L2-6 | Environment-based config | `.env.example` with `LIBRE_EMAIL`, `LIBRE_PASSWORD`, `LIBRE_REGION`; never commit secrets |
| L2-7 | CORS allowlist for Vite dev origin | Production build documents allowed origin |

**Technical spike tasks:**

- [ ] Verify chosen library version against live API (login + graph + logbook).
- [ ] Document exact JSON field names from `graph` and `logbook` responses.
- [ ] Confirm whether primary Libre account ever works vs follower-only.

---

### Epic 3: Frontend — Connect Libre UI

**Goal:** User can connect and load data without CSV.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L3-1 | "Connect Libre" panel in UI | Email, password, region; link to self-follow setup doc |
| L3-2 | Connection status indicator | Connected / error / last sync time |
| L3-3 | "Load from Libre" replaces or merges CSV data | Existing day selector and OSC mixer update |
| L3-4 | Error messages for common failures | 403/TOS, wrong account type, no connections, network |
| L3-5 | Privacy notice when using backend | Clear copy: credentials go to backend URL user configures |

---

### Epic 4: "How do I sound today?"

**Goal:** One-click feature for today's sonic identity.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L4-1 | Prominent **"How do I sound today?"** button | Visible when backend connected or env pre-configured |
| L4-2 | Fetches today → builds wavetable → assigns OSC 1 | Works with as few as N readings (define minimum, e.g. 12) |
| L4-3 | Partial day handling | If < full day of data, show "based on last X hours" |
| L4-4 | Optional auto-refresh toggle | Poll every 5 min; update wavetable without losing synth settings |
| L4-5 | Sound design hook | Optionally trigger glucose-driven randomize for today's stats |

---

### Epic 5: Hybrid data model (API + CSV)

**Goal:** Best of both worlds — live recent + deep archive.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L5-1 | Merge API days with CSV days by date key | Later source wins or user picks per merge policy |
| L5-2 | Source badge on day selector | "CSV", "Libre", or "Both" |
| L5-3 | CSV upload still works when Libre connected | No regression to current workflow |
| L5-4 | Document when to use CSV vs API | Update `docs/libreview-format.md` with hybrid section |

---

### Epic 6: Nightscout adapter (optional)

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L6-1 | `parseNightscoutEntries(json)` adapter | Maps SGV entries to `GlucoseReading[]` |
| L6-2 | UI: Nightscout URL + API secret | Fetch entries for date range |
| L6-3 | No Libre credentials in Glukoscillator | Only Nightscout token |

---

### Epic 7: Documentation and onboarding

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| L7-1 | `docs/libre-linkup-setup.md` | Self-follow step-by-step with screenshots placeholders |
| L7-2 | `docs/libre-api-backend.md` | Run backend locally, env vars, troubleshooting 403 |
| L7-3 | Update architecture diagram | Show API path parallel to CSV |
| L7-4 | Update README feature list | Libre connect + "sound today" |
| L7-5 | Security section | Self-hosted recommendation; no credential logging |

---

## Phased delivery plan

### Phase 0 — Spike (1–2 days)

- Create LibreLinkUp follower account; confirm graph + logbook responses.
- Pick library (`libre-link-unofficial-api` vs `pylibrelinkup`) based on maintenance and API 4.16.0 support.
- Save anonymized JSON fixtures for tests.

### Phase 1 — MVP (1–2 weeks)

- Backend: connect + today + days endpoints.
- Parser refactor + API adapter.
- Basic Connect UI + manual refresh.
- **"How do I sound today?"** button.

### Phase 2 — Polish

- Auto-refresh, merge with CSV, better errors.
- Self-hosted Docker compose.
- Optional Nightscout adapter.

### Phase 3 — Future (only if product direction changes)

- Abbott official API partner track.
- Commercial broker integration.
- Mobile PWA offline cache of last sync.

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Abbott API breaking changes | Integration stops working | Pin library versions; monitor GitHub issues; abstract behind adapter interface |
| Unofficial API / ToS | Account restriction or legal exposure | Document personal use; self-hosted; no credential harvesting service |
| Incomplete "today" before midnight | Wavetable only covers morning | Use graph window; label UI "last 12 hours" |
| Logbook ≠ full day resolution | Gaps vs CSV | Set expectations; keep CSV for fidelity |
| Credential exposure | Privacy breach | Backend-only secrets; httpOnly cookies; no logging of passwords |
| Regional API differences | Login fails abroad | Explicit region selector; auto-detect with fallback |
| LibreLinkUp ToS not accepted | 403 errors | Troubleshooting doc: open app, accept ToS, re-login |
| CORS / mixed content | Browser blocks API | Backend on same origin or proxied via Vite dev proxy |

---

## Security checklist (implementation)

- [ ] Credentials only in backend environment or POST body over HTTPS
- [ ] No Libre passwords in frontend localStorage
- [ ] Session tokens httpOnly, Secure in production
- [ ] Rate limit login endpoint
- [ ] Structured logs without PII/glucose values in production
- [ ] `.env` in `.gitignore`; provide `.env.example` only

---

## Testing strategy

| Layer | Approach |
|-------|----------|
| Adapter | Fixture JSON from real API (anonymized) → expected `ParsedLibreViewData` |
| Backend | Integration tests with mocked HTTP (nock/msw) or recorded cassettes |
| E2E | Manual: connect → load today → hear wavetable change |
| Regression | Existing CSV sample still loads; wavetable byte-stable for same input |

Note: `BUILD_AND_TEST.md` currently states no automated tests — this epic introduces first tests around parser/adapters.

---

## Open questions

1. **Minimum readings for "today" wavetable?** — Too few points may produce degenerate waveforms; define threshold and fallback message.
2. **Time zone for "today"?** — Local browser TZ vs UTC vs Libre account region.
3. **Merge policy** when CSV and API both have same date — prefer higher resolution source?
4. **Vite dev proxy vs separate port** — Single origin simplifies cookies.
5. **Node vs Python backend** — Node aligns with frontend stack; Python has mature `pylibrelinkup`.
6. **Export `groupReadingsByDay`** — Refactor now or duplicate in adapter temporarily?

---

## References

### Official / regulatory

- [FDA 510(k) K223537 — Libre Data Sharing API](https://www.accessdata.fda.gov/cdrh_docs/reviews/K223537.pdf)
- [Abbott + Epic integration (Apr 2025)](https://abbott.mediaroom.com/2025-04-29-Abbott-Integrates-Libres-Data-with-Epics-Electronic-Health-Record-System,-Providing-Healthcare-Professionals-Seamless-Glucose-Monitoring-Information)
- [LibreLinkUp product info](https://www.librelinkup.com/articles/getting-started/)

### Community / unofficial

- [LibreView Unofficial API docs](https://libreview-unofficial.stoplight.io/)
- [FokkeZB/libreview-unofficial](https://github.com/FokkeZB/libreview-unofficial)
- [DRFR0ST/libre-link-unofficial-api](https://github.com/DRFR0ST/libre-link-unofficial-api)
- [robberwick/pylibrelinkup](https://github.com/robberwick/pylibrelinkup)
- [timoschlueter/nightscout-librelink-up](https://github.com/timoschlueter/nightscout-librelink-up)
- [LibreLinkUp HTTP flow gist](https://gist.github.com/khskekec/6c13ba01b10d3018d816706a32ae8ab2)

### API breakage (Oct 2025)

- [nightscout-connect PR #53 — Account-Id + 4.16.0](https://github.com/nightscout/nightscout-connect/pull/53)
- [DiaKEM/libre-link-up-api-client #35](https://github.com/DiaKEM/libre-link-up-api-client/issues/35)
- [xDrip discussion #4203](https://github.com/NightscoutFoundation/xDrip/discussions/4203)

### Commercial aggregators (reference only)

- [Thryve — Abbott FreeStyle Libre integration](https://www.thryve.health/features/connections/abbott-freestyle-libre-integration)

---

## Appendix: Example backend environment

```env
# .env.example — backend only, never commit real values
LIBRE_EMAIL=follower-account@example.com
LIBRE_PASSWORD=
LIBRE_REGION=EU
SESSION_SECRET=change-me
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Appendix: LibreLinkUp self-follow checklist

- [ ] Second email address created
- [ ] LibreLinkUp app installed; follower account registered
- [ ] FreeStyle Libre app → Connected Apps → LibreLinkUp → invitation sent
- [ ] Invitation accepted in LibreLinkUp app
- [ ] Latest Terms of Service accepted in LibreLinkUp app
- [ ] Test login via chosen library CLI/script before wiring UI

---

*This document is a planning backlog item, not a commitment to implement all epics. Prioritize Epic 1–4 for the "How do I sound today?" MVP.*
