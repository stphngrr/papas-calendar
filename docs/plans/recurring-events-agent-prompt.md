# Recurring Events — Agent Prompt

You are implementing recurring events for Papa's Calendar. Everything you need is in this prompt and the referenced files in the repo.

## Your Task

Implement the feature described in `docs/plans/recurring-events.md` (design spec) by following `docs/plans/recurring-events-implementation.md` (implementation plan) step by step. **Read both files in full before writing any code.**

## Project Overview

Papa's Calendar is a client-side React + TypeScript + Vite app that generates printable monthly PDF calendars. No backend. All data lives in CSV files and browser session state. It's hosted on GitHub Pages.

**Data flow:** CSV upload → `CalendarEvent[]` → filter by groups → combine with holidays + moon phases → `buildCalendarGrid()` → render HTML preview or generate PDF via jsPDF.

**Architecture:** All business logic lives in `src/lib/` as pure functions with no React dependency. The React layer is thin — `src/hooks/useCalendarState.ts` manages all state, and components in `src/components/` are UI-only.

## Key Files You'll Touch

| File | Role |
|------|------|
| `src/types.ts` | Shared types: `CalendarEvent`, `EventType`, `CalendarDay`, `CalendarGrid` |
| `src/lib/recurrence.ts` | **NEW** — recurrence rule parsing, expansion, formatting, serialization |
| `src/lib/csv.ts` | CSV parse/export — adding `Recurrence` column support |
| `src/lib/calendar.ts` | `buildCalendarGrid` — adding recurring events parameter |
| `src/hooks/useCalendarState.ts` | State hook — updating `filteredEvents` for R events |
| `src/components/EventForm.tsx` | Add Event form — recurrence fields when type is R |
| `src/components/EventList.tsx` | Event list — recurrence display, filtering, inline edit |
| `src/components/CalendarPreview.tsx` | HTML preview — rendering `recurringEvents` in day cells |
| `src/lib/pdf.ts` | PDF generation — rendering recurring events in day cells |
| `src/App.tsx` | Root component — wiring expansion into grid building |

## Commands

```bash
npm run dev          # Dev server at localhost:5173
npm test             # Full test suite (vitest run)
npx vitest run src/lib/recurrence.test.ts      # Single test file
npx vitest run -t "expands weekly Sunday"      # Single test by name
npx tsc --noEmit     # Type-check (must be 0 errors)
```

## Rules You Must Follow

1. **TDD strictly.** Write a failing test first. Run it to confirm it fails. Write the minimum code to pass. Run it to confirm it passes. Then commit. No exceptions.

2. **Commit after every green test run.** Small commits, descriptive messages. Format: `Add parseRecurrenceRule with tests`, not `WIP` or `stuff`.

3. **Run the full test suite (`npm test`) before every commit.** Zero failures required. Don't commit with broken tests.

4. **Run `npx tsc --noEmit` frequently.** Zero errors required. Fix type errors as soon as they appear.

5. **Every new `.ts` / `.tsx` file must start with two comment lines beginning with `ABOUTME:`** that explain what the file does. Check any existing file for the pattern.

6. **Match the style of surrounding code.** Look at how existing tests are structured, how existing components are organized. Don't introduce new patterns.

7. **Make the smallest changes possible.** Don't refactor code you didn't need to change. Don't add features the plan doesn't ask for. Don't add comments explaining what changed or why it's better.

8. **Never delete a test.** If a test breaks because of your changes, update the assertion to match the new correct behavior, or fix your code.

9. **Don't mock real logic in tests.** Tests should exercise actual functions. Check existing tests — they use real parsing, real grid building, etc.

10. **Test output must be clean.** No unexpected warnings or errors in test output.

11. **Don't create documentation files** (README, markdown) unless the plan says to.

12. **Read a file before editing it.** Understand what's there. Don't guess.

## Phase Execution Order

Follow the implementation plan phases in order (1 through 10). Each phase tells you exactly:
- Which files to create or modify
- What tests to write (with code)
- What implementation to write (with code)
- What to watch out for
- When to commit

**Do not skip ahead.** Phase N may depend on Phase N-1 being complete and committed.

## Critical Design Decisions (Already Made)

These decisions are final. Don't revisit them:

- **Recurring events use type `'R'`** in the same `CalendarEvent` type, with an optional `recurrence?: RecurrenceRule` field.
- **R events store `month: 0, day: 0`** — these fields are unused. Placement is driven by the recurrence rule.
- **Expanded recurring events go into a new `recurringEvents: string[]` field on `CalendarDay`**, NOT into the existing `.events` array. This keeps rendering simple — no prefix, no ID, no special-casing.
- **Recurring events render as plain text** (no `B:` or `A:` prefix). The event name IS the display string, including any time (e.g., "CHURCH - 9 AM").
- **CSV format adds an optional 6th column `Recurrence`.** Old 5-column CSVs must still parse correctly.
- **R events always pass the month filter** in both `filteredEvents` (state hook) and the EventList UI filter.
- **Group filtering applies to R events** the same as B/A events.

## Validation Target

The file `examples/JANUARY 2025 - C.pdf` is the reference. It shows January 2025 with these recurring events:
- CHURCH - 9 AM: every Sunday (days 5, 12, 19, 26)
- SUNDAY SCHOOL 10:15 AM: every Sunday (days 5, 12, 19, 26)
- 7:00 PM - CHURCH ADULT BIBLE STUDY: every Tuesday (days 7, 14, 21, 28)
- COMMUNION: 1st Sunday only (day 5)

Phase 10 has you write tests validating these exact dates.

## Getting Started

1. Read `docs/plans/recurring-events.md` (design spec)
2. Read `docs/plans/recurring-events-implementation.md` (implementation plan)
3. Read `src/types.ts` to understand the current type system
4. Read `src/lib/csv.ts` to understand current CSV parsing
5. Read `src/lib/calendar.ts` to understand grid building
6. Start Phase 1
