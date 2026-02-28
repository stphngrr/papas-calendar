# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Papa's Calendar is a client-side React web app that generates printable monthly calendars populated with birthdays, anniversaries, holidays, and moon phases. Fully stateless — no backend, no database. All data lives in the user's CSV file and browser session. Hosted on GitHub Pages.

Read `docs/plans/design-spec.md` for the full design and `docs/plans/implementation-plan.md` for the build plan.

## Build & Dev Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build to dist/
npm test             # Run all tests (vitest run)
npx vitest run src/lib/csv.test.ts          # Run a single test file
npx vitest run -t "parses a single birthday row"  # Run a single test by name
npx tsc --noEmit     # Type-check without emitting
```

## Tech Stack

- **React + TypeScript + Vite** — static SPA, no server
- **Vitest + React Testing Library** — test runner and component testing
- **PapaParse** — CSV parsing/export
- **jsPDF** — PDF generation via direct drawing (not html2canvas)
- **lune** — moon phase computation (custom type declarations in `src/lune.d.ts`)

## Architecture

All business logic lives in `src/lib/` as pure functions with no React dependency:
- `calendar.ts` — date math, grid layout (`buildCalendarGrid`)
- `csv.ts` — CSV parse/export (`parseEventsFromCsv`, `exportEventsToCsv`)
- `holidays.ts` — holiday definitions (fixed + floating) and filtering
- `moon.ts` — moon phase dates for a given month
- `pdf.ts` — jsPDF direct-drawing of the calendar grid

React layer is thin: `src/hooks/useCalendarState.ts` holds all app state. Components in `src/components/` are UI only — they call into `lib/` for logic.

The data flow: CSV upload → in-memory event list → filter by groups → combine with holidays + moon phases → `buildCalendarGrid()` → render preview (HTML) or generate PDF (jsPDF).

## Key Types (src/types.ts)

- `CalendarEvent` — a birthday or anniversary with name, type (B/A), date, groups
- `CalendarGrid` — the 2D week/day grid with overflow events for impossible dates
- `Holiday`, `MoonPhase` — auto-generated calendar annotations

## Conventions

- Every `.ts`/`.tsx` file starts with two `ABOUTME:` comment lines explaining what the file does
- Tests live next to source: `foo.ts` → `foo.test.ts`
- TDD: write failing test → make it pass → refactor → commit
- CSV format: `Name,Type,Month,Day,Groups` — groups are comma-separated in quotes when multiple
- All calendar text renders in ALL CAPS
- PDF layout: landscape letter (279.4mm × 215.9mm), 7-column grid, Sunday–Saturday

## PDF Generation Notes

The PDF is drawn programmatically with jsPDF (not screenshotted from HTML). The HTML preview is a visual approximation; the PDF is the authoritative output. Key jsPDF details:
- Coordinate origin is top-left, Y increases downward, units in mm
- Font size is always in points regardless of document unit
- Text is not auto-clipped — must measure and scale/truncate manually
- All state (font, color, line width) is sticky until changed

## Improvements Tracking

`docs/improvements.md` tracks planned work. When completing an item from this list, always mark it as done (wrap in `~~strikethrough~~`).

## Deployment

GitHub Pages via GitHub Actions. The `base` in `vite.config.ts` must match the repo name. Push to `main` triggers build + deploy.
