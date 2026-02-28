# Dynamic PDF Row Count

## Context

The PDF always draws 6 body rows. Months needing only 4 or 5 rows waste space with empty rows. The fix: use 5 or 6 rows depending on the month. Minimum 5 rows (pad 4-row months to 5), maximum 6 (natural). For 4-row months like Feb 2026, the 5th row is empty space where the title is placed.

## Files to Modify

- `src/lib/pdf.ts` — rename `padGridToSixRows` → pad to 5 min, make row count dynamic (5 or 6)
- `src/lib/pdf.test.ts` — update `padGridToSixRows` tests → new name/behavior, update `findTitleRegion` tests

## Implementation

### 1. Rename `padGridToSixRows` → `padGridToMinRows` (or similar) in `pdf.ts`

- Pad to 5 rows minimum instead of 6 (change `BODY_ROWS` target from 6 to 5 in the pad function)
- Remove the `BODY_ROWS = 6` constant — replace with `MIN_BODY_ROWS = 5`
- `ROW_HEIGHT` becomes dynamic: computed from `paddedWeeks.length` in `generateCalendarPdf`

### 2. Make layout functions use dynamic row count

In `generateCalendarPdf`:
- `const paddedWeeks = padGridToMinRows(grid.weeks)` — pads to 5 min, leaves 6-row months at 6
- `const bodyRows = paddedWeeks.length` (will be 5 or 6)
- `const rowHeight = (GRID_HEIGHT - HEADER_ROW_HEIGHT) / bodyRows`
- Pass `bodyRows` and `rowHeight` to internal functions that currently use the constants:
  - `drawGrid(doc, bodyRows, rowHeight)`
  - `drawDayCells(doc, weeks, rowHeight)` — uses rowHeight for y-positioning
  - `findOverflowCells(weeks, count)` — uses `weeks.length` instead of `BODY_ROWS`
  - `findTitleRegion(weeks, reserved)` — uses `weeks.length` instead of `BODY_ROWS`
  - `drawOverflowEvents(doc, cells, events, rowHeight)`
  - `drawTitle(doc, region, title, rowHeight)`

### 3. Update tests (`pdf.test.ts`)

- Rename `padGridToSixRows` tests → test new function:
  - 4-row grid → padded to 5
  - 5-row grid → unchanged at 5
  - 6-row grid → unchanged at 6
  - Immutability test stays
- Update `findTitleRegion` tests:
  - **Feb 2026 (4→5 rows)**: padded to 5. Row 4 is all null → title spans row 4, cols 0-6
  - **Nov 2025 (6 rows)**: stays the same
  - **Dec 2025 (5 rows)**: remove old padding call, pass 5-row grid directly. Row 0 col 0 + row 4 cols 4-6 are empty. Largest empty rect is row 4 cols 4-6 (3 cells).
- Update import to use new function name

## TDD Order

1. Update test imports and expectations for renamed pad function — confirm failures
2. Rename function in pdf.ts, change padding target to 5, make row count dynamic — confirm pass
3. Full suite + type-check
4. Visual verification with generated PDFs

## Verification

1. `npm test` — all tests pass
2. `npx tsc --noEmit` — clean
3. Generate PDFs for Feb 2026 (5 rows), Nov 2025 (6 rows), Dec 2025 (5 rows) — visually confirm correct row count and layout
