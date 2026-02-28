# Papa's Calendar — Implementation Plan

Read `docs/plans/design-spec.md` first. This plan assumes you've read it.

This plan is organized as sequential phases. Each phase contains bite-sized tasks.
**Every task must follow TDD**: write a failing test, make it pass, refactor, commit.
Commit after every green test. Commit messages should reference the task number
(e.g., "feat: 2.1 — CSV parser handles basic birthday rows").

---

## Conventions

### File Organization

```
papas-calendar/
├── docs/plans/              # You are here
├── examples/                # PDF examples of hand-made calendars (reference only)
├── src/
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Pure logic (no React imports)
│   │   ├── csv.ts           # CSV parsing and export
│   │   ├── calendar.ts      # Date math, grid layout
│   │   ├── holidays.ts      # Holiday definitions and computation
│   │   ├── moon.ts          # Moon phase computation
│   │   └── pdf.ts           # PDF generation with jsPDF
│   ├── types.ts             # Shared TypeScript types
│   ├── App.tsx              # Root component
│   ├── App.css              # Root styles
│   └── main.tsx             # Vite entry point
├── public/                  # Static assets
├── index.html               # Vite HTML entry
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts         # Test config (if separate from vite.config.ts)
```

### ABOUTME Comments

Every file must start with a 2-line comment explaining what it does. Each line
starts with `ABOUTME:`. Example:

```ts
// ABOUTME: Parses and exports CSV files containing birthday and anniversary events.
// ABOUTME: Handles multi-group fields, deduplication, and PapaParse integration.
```

### Testing

We use **Vitest** (comes with Vite). Tests live next to source files:
`src/lib/csv.test.ts` tests `src/lib/csv.ts`.

**Test design rules:**
- Never mock the module you're testing. Only mock external dependencies (network,
  filesystem, browser APIs) when absolutely necessary.
- Test real behavior, not implementation details. If you refactor internals and
  tests break, the tests were wrong.
- Each test should test ONE thing. Name it like: `"parses a single birthday row"`,
  not `"test csv parsing"`.
- If you're testing that a function returns the right value, assert on the value.
  If you're testing that it throws, assert on the throw. Don't do both in one test.
- For React components, use **React Testing Library** (`@testing-library/react`).
  Test what the user sees and does — click buttons, check text appears — not
  component internals or state values.
- **NEVER write a test that passes because of a mock.** If your test would still
  pass with an empty function body because the mock is doing all the work, the
  test is worthless. A good test fails when you delete the implementation.

### Commits

Commit after every passing test or meaningful change. Small, frequent commits.
Branch name: `feat/papas-calendar` (or similar). Don't let uncommitted work pile up.

---

## Phase 0: Project Scaffolding

### Task 0.1: Initialize the Vite project

**What:** Create the React + TypeScript project with Vite.

**Steps:**
1. From the repo root (`papas-calendar/`), run:
   ```bash
   npm create vite@latest . -- --template react-ts
   ```
   If it complains about the directory not being empty (because `docs/` and
   `examples/` exist), use a temp directory and move files in. Do NOT delete
   `docs/` or `examples/`.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to verify the default Vite app loads in a browser.
4. Delete the default Vite boilerplate content in `App.tsx` (the counter demo).
   Replace with a placeholder `<h1>Papa's Calendar</h1>`.
5. Delete `src/assets/` if created (we won't use it).

**Commit:** "chore: 0.1 — scaffold Vite + React + TypeScript project"

### Task 0.2: Set up Vitest and React Testing Library

**What:** Configure the test runner and write a smoke test.

**Steps:**
1. Install test dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```
2. In `vite.config.ts`, add the Vitest config:
   ```ts
   /// <reference types="vitest/config" />
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test-setup.ts',
     },
   })
   ```
3. Create `src/test-setup.ts`:
   ```ts
   import '@testing-library/jest-dom'
   ```
4. Add to `tsconfig.json` (or `tsconfig.app.json`) `compilerOptions`:
   ```json
   "types": ["vitest/globals"]
   ```
5. Write a smoke test in `src/App.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react'
   import App from './App'

   test('renders the app title', () => {
     render(<App />)
     expect(screen.getByText("Papa's Calendar")).toBeInTheDocument()
   })
   ```
6. Run `npx vitest run` and confirm it passes.
7. Add a `"test"` script to `package.json`: `"test": "vitest run"`.

**Commit:** "chore: 0.2 — configure Vitest and React Testing Library"

### Task 0.3: Install core dependencies

**What:** Install the libraries we'll use throughout the project.

```bash
npm install papaparse jspdf lune
npm install -D @types/papaparse
```

Note: `lune` has no `@types` package. We'll write a small type declaration file
for it in Task 2.4.

**Commit:** "chore: 0.3 — install papaparse, jspdf, lune"

### Task 0.4: Create the shared types file

**What:** Define the core TypeScript types used across the app.

**File:** `src/types.ts`

```ts
// ABOUTME: Shared TypeScript types for calendar events, holidays, and moon phases.
// ABOUTME: These types are used across lib/, components/, and hooks/.

export type EventType = 'B' | 'A'

export interface CalendarEvent {
  id: string            // UUID for React keys and CRUD operations
  name: string          // Display name, e.g. "AMY HOLLAND"
  type: EventType       // B = birthday, A = anniversary
  month: number         // 1-12
  day: number           // 1-31
  groups: string[]      // e.g. ["Lewis", "Hooper"]
}

export interface Holiday {
  name: string          // Display name, e.g. "PRESIDENTS' DAY"
  month: number         // 1-12
  day: number           // 1-31 (resolved for a specific year)
}

export interface MoonPhase {
  type: 'Full Moon' | 'New Moon' | 'First Qtr' | 'Last Qtr'
  month: number
  day: number
}

export interface CalendarDay {
  day: number
  events: CalendarEvent[]
  holidays: Holiday[]
  moonPhases: MoonPhase[]
}

export interface CalendarGrid {
  year: number
  month: number         // 1-12
  weeks: (CalendarDay | null)[][] // 5-6 rows of 7 columns; null = empty cell
  overflowEvents: CalendarEvent[] // Events on dates that don't exist this month
}
```

No test needed for a types-only file.

**Commit:** "feat: 0.4 — define shared TypeScript types"

---

## Phase 1: Calendar Grid Logic

This phase is pure date math — no UI, no PDF, no CSV. Just figuring out which
days go in which cells.

**Reference file:** `src/lib/calendar.ts`
**Test file:** `src/lib/calendar.test.ts`

### Task 1.1: Build the calendar grid for a given month

**What:** Write a function `buildCalendarGrid(year, month, events, holidays,
moonPhases)` that returns a `CalendarGrid`.

The grid is a 2D array of weeks (rows) and days (columns). Sunday is column 0,
Saturday is column 6. Each cell is either a `CalendarDay` or `null` (for empty
cells before the 1st or after the last day).

**TDD sequence:**

1. **Test:** "February 2026 starts on Sunday, has 28 days, needs 4 full weeks + partial 5th"
   - Call `buildCalendarGrid(2026, 2, [], [], [])`
   - Assert: `grid.weeks` has 5 rows
   - Assert: `grid.weeks[0][0]` has `day: 1` (Feb 1 2026 is a Sunday)
   - Assert: `grid.weeks[3][6]` has `day: 28`
   - Assert: `grid.weeks[4]` is all nulls (empty trailing row)

   Wait — actually, check what February 2026 looks like. Feb 1 2026 is a
   **Sunday**. 28 days. So the grid fills Sunday row 1 through Saturday row 4
   perfectly, with rows 0-3 being full. Row 4 would be empty. But looking at the
   example PDF, Feb 2026 has 5 rows of dates (1-7, 8-14, 15-21, 22-28) and then
   a 5th row that contains overflow. So the grid should have exactly 4 rows of
   dates, plus potentially a 5th row for overflow/title. Adjust your assertions
   based on the real day-of-week for Feb 1 2026.

   **Use `new Date(year, month - 1, 1).getDay()`** to find the starting day of
   week (0 = Sunday).

2. **Test:** "November 2025 starts on Saturday, needs 6 rows"
   - Nov 1 2025 is a Saturday (column 6).
   - 30 days. Last day (Nov 30) lands on a Sunday.
   - Assert: `grid.weeks` has 6 rows (some months need 6).

3. **Test:** "events are placed in the correct day cells"
   - Pass in an event for Feb 4 and one for Feb 28.
   - Assert each event appears in the correct cell's `events` array.

4. **Test:** "events on nonexistent dates go into overflowEvents"
   - Pass in an event for Feb 29 when year is 2026 (not a leap year).
   - Assert: `grid.overflowEvents` contains that event.
   - Assert: no cell contains that event.

5. **Test:** "events on Feb 29 are NOT overflow in a leap year"
   - Year 2028 (leap year), event on Feb 29.
   - Assert: event is in the grid, not in overflow.

6. **Test:** "holidays and moon phases are placed in correct cells"
   - Similar to events — pass them in, verify they land on the right day.

**Implementation notes:**
- Use JavaScript's `Date` object for day-of-week calculations. `new Date(year,
  month - 1, 1).getDay()` gives Sunday=0 through Saturday=6.
- Number of days in a month: `new Date(year, month, 0).getDate()`.
- The function takes pre-filtered events (already filtered by group). Filtering
  happens upstream.

**Commit after each passing test.**

---

## Phase 2: CSV Parsing and Export

**Reference files:** `src/lib/csv.ts`, `src/lib/csv.test.ts`

### Task 2.1: Parse a basic CSV string into CalendarEvents

**What:** Write `parseEventsFromCsv(csvString: string): CalendarEvent[]`.

Uses PapaParse to parse the CSV. Expected columns: `Name`, `Type`, `Month`,
`Day`, `Groups`.

**TDD sequence:**

1. **Test:** "parses a single birthday row"
   ```
   Name,Type,Month,Day,Groups
   Amy Holland,B,2,4,Lewis
   ```
   Assert: returns one event with correct fields. `groups` is `["Lewis"]`.

2. **Test:** "parses multiple groups in quoted field"
   ```
   Name,Type,Month,Day,Groups
   Sam Jones,A,2,19,"Lewis,Hooper"
   ```
   Assert: `groups` is `["Lewis", "Hooper"]`.

3. **Test:** "parses multiple rows"
   Pass a CSV with 3 rows. Assert: returns 3 events with unique `id`s.

4. **Test:** "handles empty groups gracefully"
   A row with an empty Groups field. Assert: `groups` is `[]`.

5. **Test:** "trims whitespace from fields"
   A row like `" Amy Holland ", B , 2 , 4 , Lewis`. Assert: name is
   `"Amy Holland"`, not `" Amy Holland "`.

6. **Test:** "deduplicates events with same name, type, month, day"
   Two identical rows. Assert: returns 1 event, not 2.

7. **Test:** "skips rows with invalid data (missing name, bad month/day)"
   Rows with missing name, month 13, day 0, etc. Assert: these are skipped.
   Valid rows still parse.

**Implementation notes:**
- Use `Papa.parse(csvString, { header: true, skipEmptyLines: true })`.
- Generate `id` with `crypto.randomUUID()`.
- Groups field: split on comma, trim each, filter out empties.
- Dedup key: `${name.toLowerCase()}|${type}|${month}|${day}`.

### Task 2.2: Export CalendarEvents to a CSV string

**What:** Write `exportEventsToCsv(events: CalendarEvent[]): string`.

Produces the same format we parse. Multi-group fields are quoted.

**TDD sequence:**

1. **Test:** "exports a single event to CSV"
   Assert: output matches expected CSV string.

2. **Test:** "quotes groups when there are multiple"
   An event with `groups: ["Lewis", "Hooper"]`. Assert: Groups column is
   `"Lewis,Hooper"` (quoted).

3. **Test:** "round-trips: parse then export produces equivalent CSV"
   Parse a CSV, export it, parse again. Assert: same events (ignoring `id`).

**Implementation notes:**
- Use `Papa.unparse()` with explicit field order.

### Task 2.3: Trigger a file download from a CSV string

**What:** Write `downloadCsv(csvString: string, filename: string): void`.

This is a browser utility — creates a Blob, creates a download link, clicks it.
This function is thin and browser-dependent. **Do not unit test it** — it will be
tested via integration/manual testing. Just write it and move on.

**Implementation:**
```ts
export function downloadCsv(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

### Task 2.4: Add type declarations for `lune`

**What:** Create `src/lune.d.ts` so TypeScript knows about `lune`.

```ts
// ABOUTME: Type declarations for the lune moon phase library.
// ABOUTME: Covers only the functions we use: phase_hunt.

declare module 'lune' {
  interface PhaseResult {
    new_date: Date
    q1_date: Date
    full_date: Date
    q3_date: Date
    nextnew_date: Date
  }

  export function phase_hunt(date: Date): PhaseResult
}
```

No test needed for type declarations.

**Commit after each sub-task.**

---

## Phase 3: Moon Phases

**Reference files:** `src/lib/moon.ts`, `src/lib/moon.test.ts`

### Task 3.1: Get moon phases for a given month

**What:** Write `getMoonPhases(year: number, month: number): MoonPhase[]`.

Returns an array of 0–8 `MoonPhase` objects (typically 3–5 per month). Each has
a `type` and `day`.

**TDD sequence:**

1. **Test:** "returns moon phases for February 2026"
   - Call `getMoonPhases(2026, 2)`.
   - Assert: returns an array of MoonPhase objects.
   - Assert: each entry has a valid `type` and `day` between 1 and 28.
   - Cross-check against the example PDF: Feb 2026 shows "FULL MOON" on day 1
     and "LAST QTR" on day 9. Use these as assertions.

2. **Test:** "returns moon phases for December 2025"
   - Cross-check against example: "FULL MOON" on day 4, "LAST QTR" on day 11,
     "NEW MOON" on day 19, "FIRST QTR" on day 27.

3. **Test:** "returns empty array for no phases in month (edge case — unlikely but handle it)"

**Implementation notes:**
- Use `lune.phase_hunt()` called with the 1st and 15th of the month to catch
  all phases. Collect all returned dates, filter to those within the target month,
  deduplicate, and map to `MoonPhase` objects.
- `phase_hunt` returns `new_date`, `q1_date`, `full_date`, `q3_date`,
  `nextnew_date`. Map these to our `MoonPhase.type` values.
- Moon phase dates from `lune` are UTC. Convert to local date for the day number
  (or just use UTC day — for calendar purposes it doesn't matter much, but be
  consistent). If the example PDFs don't match by ±1 day, try switching between
  UTC and local.

---

## Phase 4: Holidays

**Reference files:** `src/lib/holidays.ts`, `src/lib/holidays.test.ts`

### Task 4.1: Define the holiday list

**What:** Create the curated list of holidays derived from the example calendars.

Before writing code, **extract every holiday from all example PDFs** (all 12
months of 2025 + Feb 2026 when available). Make a list. Classify each as
fixed-date or floating.

Store them as a data structure in `holidays.ts`:

```ts
interface HolidayDefinition {
  name: string
  compute: (year: number) => { month: number; day: number } | null
  // Returns null if the holiday doesn't occur that year (e.g., Election Day only in even years)
}
```

**Fixed-date examples** (just return the same month/day every year):
- Christmas Day → Dec 25
- Lincoln's Birthday → Feb 12
- All Saints' Day → Nov 1

**Floating-date examples** (require computation):
- Presidents' Day → 3rd Monday of February
- Thanksgiving → 4th Thursday of November
- Election Day → 1st Tuesday after 1st Monday in November (even years only)
- Mother's Day → 2nd Sunday of May
- Hanukkah → requires Hebrew calendar conversion (use a lookup table or library)
- Easter → use the computus algorithm (needed if Easter-adjacent holidays appear)

**TDD sequence:**

1. **Test:** "each holiday definition produces the correct date for 2025"
   - For every holiday in the list, call `compute(2025)` and assert the
     month/day matches what the example PDFs show.
   - This is the most important test. It validates the entire holiday list
     against real data.

2. **Test:** "floating holidays compute correctly for 2026"
   - Presidents' Day 2026 → Feb 16 (3rd Monday of Feb)
   - Verify against the Feb 2026 example.

3. **Test:** "Election Day returns null for odd years"

### Task 4.2: Write `getHolidaysForMonth`

**What:** Write `getHolidaysForMonth(year: number, month: number, enabledHolidays: string[]): Holiday[]`.

Takes the year, month, and a list of enabled holiday names (from the UI
checkboxes). Returns only the holidays that fall in that month and are enabled.

**TDD sequence:**

1. **Test:** "returns only holidays in the given month"
   Enable all holidays. Assert: for December 2025, returns Christmas,
   Pearl Harbor Day, Hanukkah, Winter Begins (verify against example).

2. **Test:** "respects the enabled list — disabled holidays are excluded"
   Enable all except Christmas. Assert: Christmas is not in the result.

3. **Test:** "returns empty array when no holidays fall in the month"

4. **Test:** "includes custom holidays"
   The function should also accept an optional array of custom one-off holidays
   and include them if they match the month.

**Implementation notes:**
- Iterate over all `HolidayDefinition`s, call `compute(year)`, filter by month
  and enabled list.
- Append any custom holidays that match the month.

### Task 4.3: Helper — nth weekday of month

**What:** Write `nthWeekdayOfMonth(year, month, weekday, n)` to compute floating
holidays. E.g., "3rd Monday of February" → `nthWeekdayOfMonth(2026, 2, 1, 3)`
returns day 16.

**TDD sequence:**

1. **Test:** "3rd Monday of February 2026 is day 16"
2. **Test:** "4th Thursday of November 2025 is day 27"
3. **Test:** "1st Sunday of May 2025"

Do this task BEFORE 4.1 since the holiday definitions depend on it.

**Reorder note:** Implement in this order: **4.3 → 4.1 → 4.2**.

---

## Phase 5: PDF Generation

**Reference file:** `src/lib/pdf.ts`, `src/lib/pdf.test.ts`

This is the most complex phase. The PDF is drawn programmatically using jsPDF.

### Key jsPDF Concepts (read this before starting)

- **Coordinate system:** Origin is top-left. Y increases downward. Units are
  whatever you set at construction (use `mm`).
- **Document size:** Landscape letter = 279.4mm × 215.9mm.
- **Drawing:** `rect(x, y, w, h, 'S')` strokes a rectangle. `line(x1, y1, x2,
  y2)` draws a line. `setLineWidth(w)` sets stroke thickness.
- **Text:** `text(str, x, y, options)`. Options include `align` (`'left'`,
  `'center'`, `'right'`) and `baseline` (`'top'`, `'middle'`).
- **Font:** `setFont('helvetica', 'bold')`, `setFontSize(12)` (always in
  points, regardless of document unit).
- **Text measurement:** `getTextWidth(str)` returns width in document units for
  the current font/size. `splitTextToSize(str, maxWidth)` breaks text to fit.
- **No auto-clipping:** Text that exceeds a cell boundary is NOT clipped. You
  must measure and scale or truncate.
- **State is sticky:** `setFont`, `setFontSize`, `setTextColor`, `setDrawColor`
  all persist until changed. Reset them before drawing each element.

### Task 5.1: Draw the empty calendar grid

**What:** Write a function `generateCalendarPdf(grid: CalendarGrid, options:
PdfOptions): jsPDF` that returns a jsPDF document.

Start with JUST the grid — no text content. Just the outer border, the column
lines, the row lines, and the day-of-week header row.

**Layout constants** (adjust to match examples — these are starting points):

```
Page: 279.4mm × 215.9mm (landscape letter)
Margins: ~5mm on each side
Header row height: ~8mm
Cell width: (279.4 - 10) / 7 ≈ 38.5mm
Cell height: calculated from remaining vertical space / number of rows
```

Define `PdfOptions`:
```ts
interface PdfOptions {
  title: string  // e.g. "FEBRUARY 2026"
}
```

**TDD sequence:**

Testing PDF output is tricky. You can't pixel-compare easily. Instead:

1. **Test:** "returns a jsPDF instance"
   - Call `generateCalendarPdf(grid, options)`.
   - Assert: result is an instance of `jsPDF`.

2. **Test:** "PDF has landscape orientation and letter size"
   - Assert: `doc.internal.pageSize.getWidth()` ≈ 279.4 (within 1mm).
   - Assert: `doc.internal.pageSize.getHeight()` ≈ 215.9 (within 1mm).

For visual verification, add a manual test script or a test that writes the PDF
to disk so you can open and inspect it:

```ts
// Not a real test — a helper for visual verification during development.
// Delete or skip this once the layout is confirmed.
import { writeFileSync } from 'fs'
test.skip('visual check — writes PDF to disk', () => {
  const grid = buildCalendarGrid(2026, 2, [], [], [])
  const doc = generateCalendarPdf(grid, { title: 'FEBRUARY 2026' })
  writeFileSync('/tmp/test-calendar.pdf', Buffer.from(doc.output('arraybuffer')))
})
```

Open `/tmp/test-calendar.pdf` and compare against `examples/FEBRUARY 2026.pdf`.
Iterate on layout constants until they match. This visual comparison step is
critical — don't skip it.

### Task 5.2: Add day numbers to cells

**What:** Draw the day number (large, bold) in the top-left of each cell.

**TDD:** Extend the visual check. No good way to assert text position
programmatically. The visual comparison against examples is the test.

**Implementation:**
- `setFont('helvetica', 'bold')`, `setFontSize(14)` (adjust size to match
  examples).
- `doc.text(String(day), cellX + 2, cellY + 2, { baseline: 'top' })`.

### Task 5.3: Add events, holidays, and moon phases to cells

**What:** Draw event text, holiday text, and moon phase text inside each cell.

**Implementation approach:**
- Moon phases: small text next to the day number. `setFontSize(7)`,
  `setFont('helvetica', 'normal')`. Place to the right of the day number.
- Events: below the day number. Format: `"B: AMY HOLLAND"` or `"A: SAM & KASSIE
  JONES"`. All caps. `setFontSize(7)` (adjust to match examples).
- Holidays: below events. Plain text, no prefix. Same small font size.
- Use `splitTextToSize(text, cellWidth - 4)` to wrap long names.
- If content exceeds cell height, reduce font size proportionally. Compute the
  total text height needed, compare to available cell height, and scale down if
  needed (minimum font size ~5pt to stay legible).

**TDD:** Again, visual comparison. Generate PDFs for Feb 2026, Nov 2025, Dec 2025
with real data from the examples and compare.

### Task 5.4: Add the title

**What:** Draw the month/year title ("FEBRUARY 2026") in the correct location.

**Rules from design spec:**
- 5-row grids: title goes in the empty 6th row area, centered.
- 6-row grids: title goes below the grid.

**Implementation:**
- `setFont('helvetica', 'bold')`, `setFontSize(24)` (adjust to match).
- `doc.text(title, pageWidth / 2, titleY, { align: 'center' })`.

### Task 5.5: Add overflow events

**What:** For events on nonexistent dates (e.g., Feb 29 in non-leap years),
render them in the empty cells of the last row or below the grid.

Look at the Feb 2026 example: "A: MATT & ELIZABETH KERN FEB 29" appears in the
bottom-left cell area.

**Implementation:**
- Check `grid.overflowEvents`. If any, render them in the first empty cell(s) of
  the last row.
- Append the date as text: `"A: MATT & ELIZABETH KERN FEB 29"`.

### Task 5.6: PDF download trigger

**What:** Write `downloadCalendarPdf(doc: jsPDF, filename: string): void`.

Similar pattern to CSV download — just calls `doc.save(filename)`. jsPDF has this
built in.

No unit test needed (browser API).

### Task 5.7: Visual regression — compare all three example months

**What:** Generate PDFs for Nov 2025, Dec 2025, and Feb 2026 using extracted
event data. Open each and compare side-by-side with the example PDFs. Tweak
layout constants (margins, font sizes, cell padding) until they're a close match.

This is a manual task, not an automated test. But it's critical.
**Do not move to Phase 6 until the generated PDFs look right.**

---

## Phase 6: Event Management (React UI)

Now we build the interactive UI. The app state lives in React hooks.

### Task 6.1: Create the main app state hook

**What:** Write `src/hooks/useCalendarState.ts` — a custom hook that manages the
entire app state.

```ts
interface CalendarState {
  events: CalendarEvent[]
  selectedMonth: number     // 1-12
  selectedYear: number
  enabledGroups: string[]   // which groups are checked
  enabledHolidays: string[] // which holidays are checked
  customHolidays: Holiday[] // one-off holidays for this session
  customTitle: string       // blank = default "MONTH YEAR"
}
```

Expose functions:
- `loadEventsFromCsv(csvString: string)` — replaces all events
- `addEvent(event: Omit<CalendarEvent, 'id'>)` — adds one event
- `updateEvent(id: string, updates: Partial<CalendarEvent>)` — edits an event
- `deleteEvent(id: string)` — removes an event
- `setMonth(month: number)` / `setYear(year: number)`
- `toggleGroup(group: string)` / `toggleHoliday(name: string)`
- `addCustomHoliday(holiday: Holiday)`
- `setCustomTitle(title: string)`

Derive these from state:
- `availableGroups` — unique group names from all events
- `filteredEvents` — events matching at least one enabled group, in the selected
  month

**TDD sequence:**

Test the hook using `renderHook` from React Testing Library:

1. **Test:** "initial state has current month/year and empty events"
2. **Test:** "loadEventsFromCsv replaces events and discovers groups"
3. **Test:** "addEvent adds an event with a generated id"
4. **Test:** "updateEvent modifies an event's fields"
5. **Test:** "deleteEvent removes an event"
6. **Test:** "toggleGroup adds/removes groups from enabledGroups"
7. **Test:** "filteredEvents returns only events matching enabled groups and month"
8. **Test:** "availableGroups updates when events change"

### Task 6.2: CSV upload component

**What:** `src/components/CsvUpload.tsx` — file picker + event count display.

**Behavior:**
- `<input type="file" accept=".csv">` triggers CSV parsing on file selection.
- Shows: "42 events loaded (3 groups: Lewis, Hooper, Westfahl)".
- Uploading a new file replaces the old data.

**TDD:**
1. **Test:** "shows upload button initially"
2. **Test:** "displays event count and group names after file upload"
   - Use `userEvent.upload()` to simulate file selection.
   - Assert the count text appears.

### Task 6.3: Event list and editor component

**What:** `src/components/EventList.tsx` — scrollable list with inline editing.

**Behavior:**
- Shows all events in a scrollable list. Each row shows: name, type (B/A),
  month/day, groups.
- Each row has "Edit" and "Delete" buttons.
- "Edit" replaces the row with an inline form (same fields as manual entry).
  "Save" / "Cancel" buttons.
- "Delete" removes the event immediately (no confirmation needed — they can
  re-upload the CSV).
- A search/filter box at the top to find events by name (useful when the list
  has hundreds of entries).

**TDD:**
1. **Test:** "renders event rows"
2. **Test:** "delete button removes an event"
3. **Test:** "edit button opens inline editor with current values"
4. **Test:** "save button in editor updates the event"
5. **Test:** "search box filters visible events by name"

### Task 6.4: Manual event entry component

**What:** `src/components/EventForm.tsx` — form to add a new event.

**Fields:** Name (text), Type (B/A select), Month (1-12 select), Day (1-31
select), Groups (checkboxes for existing groups + text input for new group).

**TDD:**
1. **Test:** "submitting form calls addEvent with correct values"
2. **Test:** "form clears after submission"
3. **Test:** "shows existing groups as checkboxes"

### Task 6.5: Month/Year selector component

**What:** `src/components/MonthYearSelector.tsx`

Two `<select>` dropdowns. Month is January–December. Year is a reasonable range
(current year ± 5).

**TDD:**
1. **Test:** "changing month calls setMonth"
2. **Test:** "changing year calls setYear"

### Task 6.6: Group filter component

**What:** `src/components/GroupFilter.tsx`

Checkboxes for each discovered group. All checked by default when a CSV is loaded.

**TDD:**
1. **Test:** "shows a checkbox for each group"
2. **Test:** "unchecking a group calls toggleGroup"

### Task 6.7: Holiday settings component

**What:** `src/components/HolidaySettings.tsx`

Collapsible section. Checkboxes for each built-in holiday (all on by default).
A text input + month/day pickers + "Add" button for custom one-off holidays.

**TDD:**
1. **Test:** "shows all holidays with checkboxes"
2. **Test:** "unchecking a holiday calls toggleHoliday"
3. **Test:** "adding a custom holiday appears in the list"

### Task 6.8: Export CSV button and custom title input

**What:** Two small components.

`ExportCsvButton.tsx` — calls `exportEventsToCsv(events)` and triggers download.
`CustomTitleInput.tsx` — text field, blank means default.

**TDD:**
1. **Test:** "export button is enabled when events exist"
2. **Test:** "custom title input updates state"

---

## Phase 7: Calendar Preview (HTML)

### Task 7.1: Calendar preview component

**What:** `src/components/CalendarPreview.tsx` — HTML/CSS rendering of the
calendar grid.

This is a visual approximation of the PDF output. It does NOT need to be
pixel-identical to the PDF. Its purpose is to give the user a quick preview
before downloading.

**Implementation:**
- Render a `<table>` (or CSS grid) with the same structure as the PDF: 7
  columns, 5-6 rows, header row with day names.
- Style with CSS to approximate the PDF look: black borders, landscape aspect
  ratio, text sizing.
- Use the same `CalendarGrid` data structure that the PDF generator uses.

**TDD:**
1. **Test:** "renders 7 column headers (Sunday through Saturday)"
2. **Test:** "renders the correct number of week rows"
3. **Test:** "shows day numbers in cells"
4. **Test:** "shows events with B:/A: prefix"
5. **Test:** "shows holidays without prefix"
6. **Test:** "shows moon phases"
7. **Test:** "shows the title"
8. **Test:** "shows overflow events"

### Task 7.2: Wire up live preview

**What:** Connect the preview to the app state so it updates in real time.

In `App.tsx`, compose the state hook with the grid builder:

```tsx
const state = useCalendarState()
const holidays = getHolidaysForMonth(state.selectedYear, state.selectedMonth, state.enabledHolidays)
const moonPhases = getMoonPhases(state.selectedYear, state.selectedMonth)
const grid = buildCalendarGrid(
  state.selectedYear, state.selectedMonth,
  state.filteredEvents, holidays, moonPhases
)
```

Pass `grid` to `<CalendarPreview>`. Every state change re-renders the preview.

**TDD:**
1. **Test:** "changing month updates the preview"
2. **Test:** "toggling a group updates the visible events"

### Task 7.3: Download PDF button

**What:** Wire the "Download PDF" button to generate and download the PDF.

```tsx
const handleDownload = () => {
  const doc = generateCalendarPdf(grid, {
    title: state.customTitle || `${MONTH_NAMES[state.selectedMonth - 1]} ${state.selectedYear}`,
  })
  doc.save(`${title}.pdf`)
}
```

**TDD:**
1. **Test:** "download button calls generateCalendarPdf with correct grid and
   options" — Mock `jsPDF.save` to prevent actual download, but verify the
   function is called.

---

## Phase 8: Layout and Polish

### Task 8.1: Page layout — control panel + preview side by side

**What:** Set up the CSS layout for the two-panel design.

- Left panel (control panel): fixed width ~350px, scrollable if content overflows.
- Right panel (calendar preview): fills remaining space, maintains landscape
  aspect ratio.
- On narrow screens (< 768px): stack vertically, controls on top.

Use CSS Grid or Flexbox. No CSS framework — just plain CSS (or CSS modules if
you prefer scoping).

### Task 8.2: Style the control panel

**What:** Clean up the visual design of all control panel components. Match a
simple, functional aesthetic. Nothing fancy — this is a utility app for a
non-technical user.

- Clear section labels
- Adequate spacing
- Obvious buttons
- Readable font sizes (remember the target user may be older)

### Task 8.3: Responsive check

**What:** Test on both desktop and a simulated tablet/phone. The calendar preview
should remain readable. The control panel should not require horizontal scrolling.

Manual testing task — no automated tests.

---

## Phase 9: Data Extraction from Examples

This phase extracts the initial dataset from the example PDFs.

### Task 9.1: Extract all events and holidays from example PDFs

**What:** Go through each of the 13 example PDFs (12 months of 2025 + Feb 2026).
For each, extract:

1. Every birthday (B:) and anniversary (A:) with name and date.
2. Every holiday name and date.

Write the events to `data/initial-events.csv` in our CSV format, pre-tagged with
group "Lewis". Write the holidays to a reference list for validating Task 4.1.

This can be done by running `pdftotext` on each PDF and parsing the output, or
manually. A script is fine if it saves time, but verify the output.

### Task 9.2: Validate holiday definitions against extracted data

**What:** Run the holiday tests from Task 4.1 against the extracted holiday list.
Every holiday in the PDFs should match a holiday definition's computed date. If
any don't match, fix the definition or add a missing holiday.

---

## Phase 10: Deployment

### Task 10.1: Configure Vite for GitHub Pages

**What:** Set the `base` option in `vite.config.ts` to the repo name (needed for
GitHub Pages' URL path):

```ts
export default defineConfig({
  base: '/papas-calendar/',
  // ... rest of config
})
```

Adjust if the repo name is different.

### Task 10.2: Create GitHub Actions deploy workflow

**What:** Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Task 10.3: Enable GitHub Pages in repo settings

**What:** In the GitHub repo settings → Pages → Source, select "GitHub Actions".

This is a manual step, not code.

### Task 10.4: Verify deployment

**What:** Push to `main`. Verify the GitHub Action runs. Visit the deployed URL.
Upload a CSV, generate a calendar, download the PDF. End-to-end smoke test.

---

## Phase Order Summary

| Phase | Description                | Dependencies     |
|-------|----------------------------|------------------|
| 0     | Project scaffolding        | None             |
| 1     | Calendar grid logic        | Phase 0          |
| 2     | CSV parsing and export     | Phase 0          |
| 3     | Moon phases                | Phase 0          |
| 4     | Holidays                   | Phase 0          |
| 5     | PDF generation             | Phases 1, 3, 4   |
| 6     | Event management UI        | Phases 1, 2      |
| 7     | Calendar preview + wiring  | Phases 1, 3, 4, 6|
| 8     | Layout and polish          | Phase 7          |
| 9     | Data extraction            | Phase 4          |
| 10    | Deployment                 | Phase 8          |

Phases 1–4 can be done in parallel (they're independent pure-logic modules).
Phase 5 depends on 1, 3, and 4 being done. Phase 6 depends on 1 and 2.
Phase 7 brings it all together. Phase 9 can happen any time after Phase 4.

---

## Checklist Before Calling It Done

- [ ] All tests pass (`npm test`)
- [ ] Every `.ts` and `.tsx` file has ABOUTME comments
- [ ] PDF output visually matches the example PDFs (manual comparison)
- [ ] CSV round-trip works (upload → edit → export → re-upload produces same data)
- [ ] All three example months (Nov 2025, Dec 2025, Feb 2026) render correctly
- [ ] Group filtering works (check Lewis only, check Hooper only, check multiple)
- [ ] Holiday toggles work (disable Christmas → it disappears from December)
- [ ] Custom one-off holidays appear on the calendar
- [ ] Custom title appears on the PDF
- [ ] Overflow events render for Feb 29 in non-leap years
- [ ] Moon phases match the example PDFs (±1 day tolerance)
- [ ] App works on Chrome, Firefox, Safari (manual check)
- [ ] GitHub Pages deployment works
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors or warnings in the browser
