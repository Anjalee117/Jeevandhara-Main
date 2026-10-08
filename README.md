# Jeevandhara

A functional voice-first agricultural decision and action prototype built with Next.js, React, TypeScript and Tailwind CSS. No login, backend, API keys or physical hardware required.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Start at the landing page or visit `/dashboard`.

Production:

```sh
npm run build
npm start
```

This workspace also has a temporary Node runtime at `/tmp/node-v22.20.0-darwin-arm64/bin`. Add it to PATH if Node is not installed on your machine. Install Node normally for a permanent setup.

## Validation

```sh
npm run typecheck
npx playwright install chromium
npm test
```

Tests use the production server. Run `npm run build` before `npm test`. The suite exercises the eight requested flows, context persistence, language changes, market interactions and route health at desktop and mobile viewport sizes.

## Product

- Landing and farm dashboard with Kannada and English major labels.
- Browser speech recognition, honest unsupported/permission errors, typed fallback and deterministic English/Kannada intent matching.
- Editable, persisted farmer profile used by crop health, market, weather, actions and farmer context.
- Searchable demo schemes, working filters, deterministic eligibility and decision factors.
- Image upload/drop, preview/removal, file validation, mock analysis and action creation.
- Crop-aware market prices, interactive chart, comparison and price/distance ranking.
- Location-dependent demo forecast with actionable recommendations.
- Seven simulated IoT devices, changing sensor readings, event timelines and alert acknowledgement.
- Prioritized planner with completion history and persisted 24-hour snoozes.
- Searchable knowledge documents, source inspection, notification routing and settings.

## Architecture

`app/` owns routes and layout. `components/` provides the workspace shell and shared UI. `features/` contains module interactions. `services/` exposes voice, farmer, scheme, crop health, market, weather, threat, action planner, knowledge, notification and IoT services. `data/` holds mock catalogs. `types/` holds shared models. `lib/storage.ts` implements the replaceable state repository.

Frontend features call service methods. Replace mock service implementations with API clients behind the same contracts. Replace `StateRepository` with an authenticated cloud repository to introduce server persistence. Keep deterministic eligibility rules on the server if productionized.

## Demo boundaries

All prices, weather, device data, scheme names/criteria/deadlines and knowledge documents are illustrative. Crop image analysis validates the uploaded file and returns a crop-aware fixed result; it does not classify image pixels. Browser recognition may require network services supplied by the browser and depends on browser support, HTTPS (or localhost) and microphone permission. Speech synthesis is optional. No external AI models or government feeds are connected. Confidence values are illustrative rule/mock scores.

Data persists in browser localStorage under `jeevandhara-v1`. The sidebar's **Load demo farm** resets all demo state. Settings has a reset confirmation. Farm data is specific to the browser and origin.
