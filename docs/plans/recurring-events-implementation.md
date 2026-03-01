# Recurring Events — Implementation Plan

Read `docs/plans/recurring-events.md` first. That's the design spec. This document tells you how to build it.

## Ground Rules

- **TDD always.** Write a failing test, make it pass, commit. No exceptions.
- **Commit after every green test run.** Small commits, descriptive messages.
- **Run the full test suite before each commit.** Command: `npm test`. Must be 0 failures.
- **Type-check frequently.** Command: `npx tsc --noEmit`. Must be 0 errors.
- **Don't add things the spec doesn't ask for.** No "nice to have" features.
- **Don't refactor code you didn't change** unless a test is broken.
- **Every `.ts` and `.tsx` file must start with two `ABOUTME:` comment lines.** Check existing files for the pattern. New files need them. Don't add them to files you didn't create.
- **All calendar text renders in ALL CAPS.** Event names in CSV are already uppercase. Don't add `.toUpperCase()` calls in rendering unless something is broken.
- **Read the file before you edit it.** Understand what's there. Match its style.

## How to Run Things

```bash
npm run dev                                    # Dev server at localhost:5173
npm test                                       # Full test suite (vitest run)
npx vitest run src/lib/recurrence.test.ts      # Single test file
npx vitest run -t "expands weekly Sunday"      # Single test by name
npx tsc --noEmit                               # Type-check
```

## Phase Overview

| Phase | What | Files |
|-------|------|-------|
| 1 | Types | `src/types.ts` |
| 2 | Recurrence expansion | `src/lib/recurrence.ts`, `src/lib/recurrence.test.ts` |
| 3 | CSV parsing | `src/lib/csv.ts`, `src/lib/csv.test.ts` |
| 4 | Calendar grid integration | `src/lib/calendar.ts`, `src/lib/calendar.test.ts` |
| 5 | State hook | `src/hooks/useCalendarState.ts`, `src/hooks/useCalendarState.test.ts` |
| 6 | Preview and PDF rendering | `src/components/CalendarPreview.tsx`, `src/lib/pdf.ts` + tests |
| 7 | EventForm UI | `src/components/EventForm.tsx`, `src/components/EventForm.test.tsx` |
| 8 | EventList UI | `src/components/EventList.tsx`, `src/components/EventList.test.tsx` |
| 9 | App wiring | `src/App.tsx`, `src/App.test.tsx` |
| 10 | Validation against example PDF | new test in `src/lib/recurrence.test.ts` |

---

## Phase 1: Types

**Goal:** Add the `RecurrenceRule` type and widen `EventType` to include `'R'`.

**File: `src/types.ts`**

This file defines all shared types. Currently:

```ts
export type EventType = 'B' | 'A'

export interface CalendarEvent {
  id: string
  name: string
  type: EventType
  month: number
  day: number
  groups: string[]
}
```

**Changes:**

1. Add `'R'` to the `EventType` union:
   ```ts
   export type EventType = 'B' | 'A' | 'R'
   ```

2. Add the `RecurrenceRule` type, directly above `CalendarEvent`:
   ```ts
   export type RecurrenceRule =
     | { kind: 'weekly'; dayOfWeek: number }
     | { kind: 'nth'; n: number; dayOfWeek: number }
   ```
   `dayOfWeek` uses JS convention: 0=Sunday, 1=Monday, ..., 6=Saturday. `n` is 1-based (1st, 2nd, etc.).

3. Add optional `recurrence` field to `CalendarEvent`:
   ```ts
   export interface CalendarEvent {
     id: string
     name: string
     type: EventType
     month: number
     day: number
     groups: string[]
     recurrence?: RecurrenceRule
   }
   ```

**After this change, run `npx tsc --noEmit`.** You will get type errors in `csv.ts` because `isValidType` only accepts `'B' | 'A'`. That's expected and gets fixed in Phase 3. You may also get errors in components that cast string values to `EventType`. **Don't fix these yet** — they're addressed in the phases where those files are modified.

Actually, scratch that — the type errors will block the test suite. Fix `isValidType` in `csv.ts` immediately so it accepts `'R'` too. But don't add R-event parsing logic yet — just make the type guard pass:

```ts
function isValidType(type: string): type is EventType {
  return type === 'B' || type === 'A' || type === 'R'
}
```

**But wait:** if someone passes type `R` without a `Recurrence` column, the existing validation (month/day checks) will reject R rows with blank month/day. That's actually fine for now — R events need the Recurrence column, which isn't parsed yet. The parser will correctly reject incomplete R rows. Don't add special handling yet.

**Run `npx tsc --noEmit` and `npm test`.** Fix any type errors that appear. All existing tests should still pass — nothing behavioral changed. The error message test for invalid type (`'Row 2: invalid type "X" (expected B or A)'`) will still pass because `X` is still invalid.

However, check the test in `csv.test.ts` that says `expected B or A` in the error message. If the error message string is hardcoded in `csv.ts`, update it to say `expected B, A, or R` so the error message stays accurate. Then update the corresponding test assertion.

**Commit:** `Add RecurrenceRule type and R event type`

---

## Phase 2: Recurrence Expansion

**Goal:** Build the pure function that expands recurring events into concrete day numbers for a given month/year.

**Create two new files:**
- `src/lib/recurrence.ts`
- `src/lib/recurrence.test.ts`

Both need `ABOUTME:` headers. Examples:

```ts
// ABOUTME: Expands recurring events into concrete dates for a given month/year.
// ABOUTME: Handles weekly and nth-weekday recurrence patterns.
```

### Step 2a: `parseRecurrenceRule`

This function parses a raw string like `"weekly:Sunday"` or `"nth:1:Sunday"` into a `RecurrenceRule`, or returns `null` if invalid.

**Write tests first** in `recurrence.test.ts`:

```ts
import { describe, test, expect } from 'vitest'
import { parseRecurrenceRule } from './recurrence'

describe('parseRecurrenceRule', () => {
  test('parses weekly:Sunday', () => {
    expect(parseRecurrenceRule('weekly:Sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
  })

  test('parses weekly:Tuesday', () => {
    expect(parseRecurrenceRule('weekly:Tuesday')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses weekly:Saturday', () => {
    expect(parseRecurrenceRule('weekly:Saturday')).toEqual({ kind: 'weekly', dayOfWeek: 6 })
  })

  test('is case-insensitive', () => {
    expect(parseRecurrenceRule('weekly:sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
    expect(parseRecurrenceRule('WEEKLY:TUESDAY')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses nth:1:Sunday', () => {
    expect(parseRecurrenceRule('nth:1:Sunday')).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })
  })

  test('parses nth:3:Wednesday', () => {
    expect(parseRecurrenceRule('nth:3:Wednesday')).toEqual({ kind: 'nth', n: 3, dayOfWeek: 3 })
  })

  test('parses nth:5:Friday', () => {
    expect(parseRecurrenceRule('nth:5:Friday')).toEqual({ kind: 'nth', n: 5, dayOfWeek: 5 })
  })

  test('returns null for unknown prefix', () => {
    expect(parseRecurrenceRule('daily:Monday')).toBeNull()
  })

  test('returns null for invalid day name', () => {
    expect(parseRecurrenceRule('weekly:Sundayy')).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(parseRecurrenceRule('')).toBeNull()
  })

  test('returns null for nth with n=0', () => {
    expect(parseRecurrenceRule('nth:0:Sunday')).toBeNull()
  })

  test('returns null for nth with n=6', () => {
    expect(parseRecurrenceRule('nth:6:Sunday')).toBeNull()
  })

  test('returns null for nth with non-numeric n', () => {
    expect(parseRecurrenceRule('nth:abc:Sunday')).toBeNull()
  })

  test('returns null for nth with missing parts', () => {
    expect(parseRecurrenceRule('nth:1')).toBeNull()
  })

  test('returns null for weekly with missing day', () => {
    expect(parseRecurrenceRule('weekly:')).toBeNull()
    expect(parseRecurrenceRule('weekly')).toBeNull()
  })
})
```

**Run:** `npx vitest run src/lib/recurrence.test.ts` — all should fail (module doesn't exist yet).

**Implement `parseRecurrenceRule` in `recurrence.ts`:**

You need a day-name-to-number mapping. Use an object:
```ts
const DAY_NAMES: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}
```

Parse logic:
1. Split on `:`
2. Check prefix (`weekly` or `nth`)
3. For `weekly`: expect 2 parts, look up day name
4. For `nth`: expect 3 parts, parse n as integer (1-5), look up day name
5. Return `null` for anything else

**Run tests.** All `parseRecurrenceRule` tests should pass.

**Commit:** `Add parseRecurrenceRule with tests`

### Step 2b: `expandRecurringEvents`

This is the core expansion function. Given a list of `CalendarEvent[]` and a year/month, it returns `{ name: string; day: number }[]` for every recurring event instance that falls in that month.

**Write tests first.** Use January 2025 as the test month — it starts on Wednesday, has 31 days. You can verify day-of-week with `new Date(2025, 0, 1).getDay()` (should be 3, Wednesday).

```ts
import { expandRecurringEvents } from './recurrence'
import type { CalendarEvent } from '../types'

// Helper to build a recurring event for tests
function makeRecurring(name: string, recurrence: CalendarEvent['recurrence']): CalendarEvent {
  return { id: '1', name, type: 'R', month: 0, day: 0, groups: [], recurrence }
}
```

**Test cases for `expandRecurringEvents`:**

1. **Weekly Sunday in January 2025** — should produce days 5, 12, 19, 26
2. **Weekly Tuesday in January 2025** — should produce days 7, 14, 21, 28
3. **Weekly Wednesday in January 2025** — should produce days 1, 8, 15, 22, 29 (5 occurrences, since Jan 1 is Wednesday)
4. **1st Sunday of January 2025** — should produce day 5
5. **3rd Monday of January 2025** — should produce day 20 (same as MLK Day — `nthWeekdayOfMonth` in holidays.ts uses the same math, good cross-reference)
6. **5th Thursday of January 2025** — should produce day 30
7. **5th Friday of January 2025** — should produce nothing (January 2025 only has 4 Fridays: 3, 10, 17, 24, 31... wait, 31 is the 5th Friday. Check: Jan 3 is Friday? `new Date(2025, 0, 3).getDay()` = 5 = Friday. So Fridays: 3, 10, 17, 24, 31. That's 5 Fridays. Use a month that actually has only 4 of a given weekday.)
   - Better: **5th Sunday of February 2025** — Feb 2025 starts on Saturday. Sundays: 2, 9, 16, 23. Only 4 Sundays. So nth:5:Sunday should produce nothing.
8. **Ignores non-R events** — pass a mix of B, A, and R events, verify only R events produce expansions
9. **Events without recurrence field are skipped** — an R event with undefined recurrence produces nothing
10. **Multiple recurring events expand independently** — two R events produce interleaved results

**Implement `expandRecurringEvents` in `recurrence.ts`:**

```ts
export interface ExpandedRecurringEvent {
  name: string
  day: number
}

export function expandRecurringEvents(
  events: CalendarEvent[],
  year: number,
  month: number,
): ExpandedRecurringEvent[] {
  const results: ExpandedRecurringEvent[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (const event of events) {
    if (event.type !== 'R' || !event.recurrence) continue

    const rule = event.recurrence
    if (rule.kind === 'weekly') {
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === rule.dayOfWeek) {
          results.push({ name: event.name, day: d })
        }
      }
    } else if (rule.kind === 'nth') {
      let count = 0
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === rule.dayOfWeek) {
          count++
          if (count === rule.n) {
            results.push({ name: event.name, day: d })
            break
          }
        }
      }
    }
  }

  return results
}
```

**Run tests.** All should pass.

**Commit:** `Add expandRecurringEvents with tests`

### Step 2c: `formatRecurrenceRule`

This function converts a `RecurrenceRule` into a human-readable string for display in the event list. Examples:
- `{ kind: 'weekly', dayOfWeek: 0 }` → `"Every Sunday"`
- `{ kind: 'nth', n: 1, dayOfWeek: 0 }` → `"1st Sunday of month"`
- `{ kind: 'nth', n: 2, dayOfWeek: 2 }` → `"2nd Tuesday of month"`
- `{ kind: 'nth', n: 3, dayOfWeek: 3 }` → `"3rd Wednesday of month"`

**Write tests first:**

```ts
describe('formatRecurrenceRule', () => {
  test('formats weekly rule', () => {
    expect(formatRecurrenceRule({ kind: 'weekly', dayOfWeek: 0 })).toBe('Every Sunday')
    expect(formatRecurrenceRule({ kind: 'weekly', dayOfWeek: 2 })).toBe('Every Tuesday')
  })

  test('formats nth rule with ordinal suffix', () => {
    expect(formatRecurrenceRule({ kind: 'nth', n: 1, dayOfWeek: 0 })).toBe('1st Sunday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 2, dayOfWeek: 2 })).toBe('2nd Tuesday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 3, dayOfWeek: 3 })).toBe('3rd Wednesday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 4, dayOfWeek: 4 })).toBe('4th Thursday of month')
    expect(formatRecurrenceRule({ kind: 'nth', n: 5, dayOfWeek: 5 })).toBe('5th Friday of month')
  })
})
```

You'll need a day-name array (the reverse of the lookup object) and an ordinal suffix function. Keep both private to this module.

**Run tests, implement, run tests again.**

**Commit:** `Add formatRecurrenceRule with tests`

### Step 2d: `serializeRecurrenceRule`

This is the inverse of `parseRecurrenceRule` — turns a `RecurrenceRule` back into the CSV string format. Needed by `exportEventsToCsv` in Phase 3.

```ts
describe('serializeRecurrenceRule', () => {
  test('serializes weekly rule', () => {
    expect(serializeRecurrenceRule({ kind: 'weekly', dayOfWeek: 0 })).toBe('weekly:Sunday')
    expect(serializeRecurrenceRule({ kind: 'weekly', dayOfWeek: 2 })).toBe('weekly:Tuesday')
  })

  test('serializes nth rule', () => {
    expect(serializeRecurrenceRule({ kind: 'nth', n: 1, dayOfWeek: 0 })).toBe('nth:1:Sunday')
    expect(serializeRecurrenceRule({ kind: 'nth', n: 3, dayOfWeek: 3 })).toBe('nth:3:Wednesday')
  })
})
```

**Write test, implement, verify, commit.**

**Commit:** `Add serializeRecurrenceRule with tests`

---

## Phase 3: CSV Parsing

**Goal:** Teach the CSV parser to read and write the optional `Recurrence` column.

**File: `src/lib/csv.ts`**

### How the parser works today

Look at `parseEventsFromCsv` in `csv.ts`. Key things:
- Uses PapaParse with `header: true` — each row is a `Record<string, string>` keyed by column name
- Checks for required headers: `['Name', 'Type', 'Month', 'Day']`
- Groups column is already optional (no header check — it reads `row.Groups ?? ''`)
- Validates type, month, day per row, collects errors
- Deduplicates by `name|type|month|day`

### What changes

The `Recurrence` column is optional, like `Groups`. No header check needed.

**The branching logic for R events:**
- If `type === 'R'`: parse the `Recurrence` column instead of month/day. Skip month/day validation. If recurrence is missing or invalid, report an error.
- If `type === 'B'` or `type === 'A'`: ignore the `Recurrence` column. Validate month/day as before.

### Step 3a: Write parsing tests

Add these tests to the existing `describe('parseEventsFromCsv')` block in `csv.test.ts`:

1. **Parses an R event with weekly recurrence:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
   ```
   Expect: 1 event, type `'R'`, month 0, day 0, groups `['Hooper']`, recurrence `{ kind: 'weekly', dayOfWeek: 0 }`.

2. **Parses an R event with nth recurrence:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   COMMUNION,R,,,Hooper,nth:1:Sunday
   ```
   Expect: recurrence `{ kind: 'nth', n: 1, dayOfWeek: 0 }`.

3. **Reports error for R event with missing recurrence:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   CHURCH,R,,,Hooper,
   ```
   Expect: 0 events, error like `'Row 2: R event missing recurrence rule'`.

4. **Reports error for R event with invalid recurrence:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   CHURCH,R,,,Hooper,bogus:value
   ```
   Expect: 0 events, error like `'Row 2: invalid recurrence rule "bogus:value"'`.

5. **Mixed B, A, and R events in one CSV:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   Amy Holland,B,2,4,Lewis,
   CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
   Sam Jones,A,2,19,"Lewis,Hooper",
   ```
   Expect: 3 events, correct types, B/A have month/day, R has recurrence.

6. **5-column CSV (no Recurrence header) still works:**
   Use the exact same test data from an existing test — just verify it still passes. The point is backward compatibility. No new test needed; the existing tests cover this. But add one explicit test with a comment saying why:
   ```ts
   test('backward compatible with 5-column CSV (no Recurrence column)', () => {
     const csv = `Name,Type,Month,Day,Groups
   Amy Holland,B,2,4,Lewis`
     const result = parseEventsFromCsv(csv)
     expect(result.events).toHaveLength(1)
     expect(result.events[0].recurrence).toBeUndefined()
   })
   ```

7. **B/A events ignore the Recurrence column if present:**
   ```
   Name,Type,Month,Day,Groups,Recurrence
   Amy Holland,B,2,4,Lewis,weekly:Sunday
   ```
   Expect: 1 event, type B, month 2, day 4, recurrence `undefined`. The recurrence column is silently ignored for non-R types.

8. **Deduplication for R events.** R events deduplicate by `name|type|recurrence-string` (not month/day, since those are always 0). Two identical R rows produce one event with merged groups:
   ```
   Name,Type,Month,Day,Groups,Recurrence
   CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
   CHURCH - 9 AM,R,,,Lewis,weekly:Sunday
   ```
   Expect: 1 event, groups `['Hooper', 'Lewis']`.

**Run tests — they should all fail.**

### Step 3b: Implement parsing changes

In `parseEventsFromCsv`:

1. Import `parseRecurrenceRule` from `./recurrence`.

2. After reading `rawType` and checking `isValidType`, add a branch:
   ```ts
   if (type === 'R') {
     // R events: parse recurrence, skip month/day validation
     const rawRecurrence = (row.Recurrence ?? '').trim()
     if (!rawRecurrence) {
       errors.push(`Row ${rowNum}: R event missing recurrence rule`)
       continue
     }
     const recurrence = parseRecurrenceRule(rawRecurrence)
     if (!recurrence) {
       errors.push(`Row ${rowNum}: invalid recurrence rule "${rawRecurrence}"`)
       continue
     }
     // dedup key for R events uses the recurrence string
     const dedupKey = `${name.toLowerCase()}|R|${rawRecurrence.toLowerCase()}`
     // ... dedup logic same pattern as B/A, then push event with month: 0, day: 0, recurrence
   }
   ```

3. For B/A events, the existing month/day parsing stays exactly the same. The `recurrence` field is simply not set (left `undefined`).

4. The dedup key for B/A events stays as-is: `name|type|month|day`.

**Important:** Don't refactor the dedup logic into a shared function unless it's genuinely duplicated in a confusing way. A little repetition in an `if/else` branch is fine. Premature abstraction here would make the parser harder to read.

### Step 3c: Implement export changes

In `exportEventsToCsv`:

1. Import `serializeRecurrenceRule` from `./recurrence`.

2. Change the row mapping:
   ```ts
   const rows = events.map((e) => ({
     Name: e.name,
     Type: e.type,
     Month: e.type === 'R' ? '' : e.month,
     Day: e.type === 'R' ? '' : e.day,
     Groups: e.groups.join(','),
     Recurrence: e.recurrence ? serializeRecurrenceRule(e.recurrence) : '',
   }))
   ```

3. Update the `columns` array:
   ```ts
   columns: ['Name', 'Type', 'Month', 'Day', 'Groups', 'Recurrence'],
   ```

### Step 3d: Export round-trip test

Add a round-trip test for R events:
```ts
test('round-trips R events through parse and export', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
COMMUNION,R,,,Hooper,nth:1:Sunday
Amy Holland,B,2,4,Lewis,`

  const { events } = parseEventsFromCsv(csv)
  const exported = exportEventsToCsv(events)
  const { events: reparsed } = parseEventsFromCsv(exported)

  expect(reparsed).toHaveLength(3)
  const church = reparsed.find(e => e.name === 'CHURCH - 9 AM')!
  expect(church.type).toBe('R')
  expect(church.recurrence).toEqual({ kind: 'weekly', dayOfWeek: 0 })

  const communion = reparsed.find(e => e.name === 'COMMUNION')!
  expect(communion.recurrence).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })

  const amy = reparsed.find(e => e.name === 'Amy Holland')!
  expect(amy.type).toBe('B')
  expect(amy.month).toBe(2)
  expect(amy.recurrence).toBeUndefined()
})
```

**Check that ALL existing csv tests still pass.** The export format changed (added Recurrence column), so the existing export test that checks the header line will break. Update it:
- Old assertion: `expect(csv).toContain('Name,Type,Month,Day,Groups')`
- New assertion: `expect(csv).toContain('Name,Type,Month,Day,Groups,Recurrence')`

Also check the existing round-trip test — it should still pass because B/A events get empty Recurrence columns, and the parser ignores that column for B/A types.

Also update the error message in `isValidType`'s corresponding error string if you haven't already:
```ts
errors.push(`Row ${rowNum}: invalid type "${rawType}" (expected B, A, or R)`)
```
And update the test that asserts this message.

**Run full test suite. Commit.**

**Commit:** `Add Recurrence column to CSV parsing and export`

---

## Phase 4: Calendar Grid Integration

**Goal:** Get expanded recurring events into the calendar grid's day cells.

**File: `src/lib/calendar.ts`**

### How the grid works today

`buildCalendarGrid(year, month, events, holidays, moonPhases)` builds a 2D grid of `CalendarDay` objects. Each `CalendarDay` has `.events` (array of `CalendarEvent`), `.holidays`, and `.moonPhases`.

Events are placed by matching `event.month === month` and then `event.day`. R events have month=0, day=0, so they'll never match today's logic. That's correct — R events shouldn't go through the existing event placement.

### Design decision: how expanded recurring events enter the grid

Expanded recurring events are `{ name: string; day: number }` — they're not `CalendarEvent` objects. They're closer to holidays (text on a day, computed by rule). We have two options:

**Option A:** Add a new field to `CalendarDay` for recurring event text, like `.recurringEvents: string[]`. Requires changes to CalendarDay, CalendarPreview, and pdf.ts.

**Option B:** Add a new parameter to `buildCalendarGrid` for expanded recurring events and push them into the existing `.events` array as synthetic `CalendarEvent` objects.

**Go with Option A.** It's cleaner — recurring events don't have IDs, aren't editable from the grid, and don't have B/A prefixes. Mixing them into `.events` would require downstream code to special-case R events everywhere. A dedicated field keeps things simple.

### Step 4a: Add `recurringEvents` field to `CalendarDay`

In `src/types.ts`, add to `CalendarDay`:
```ts
export interface CalendarDay {
  day: number
  events: CalendarEvent[]
  holidays: Holiday[]
  moonPhases: MoonPhase[]
  recurringEvents: string[]   // display names of expanded recurring events
}
```

**Run `npx tsc --noEmit`.** You'll get errors anywhere a `CalendarDay` is constructed without `recurringEvents`. Fix them:
- In `calendar.ts` line 26 (inside `buildCalendarGrid`), add `recurringEvents: []` to the object literal.
- In any test files that construct `CalendarDay` literals — check `calendar.test.ts` (it doesn't construct them directly, it reads them from the grid).
- Check `CalendarPreview.tsx` and `pdf.ts` — they read from `CalendarDay` but don't construct them, so they're fine for now.

**Run full test suite.** Everything should pass — the new field is empty everywhere.

**Commit:** `Add recurringEvents field to CalendarDay`

### Step 4b: Add recurring events parameter to `buildCalendarGrid`

Change the signature:
```ts
export function buildCalendarGrid(
  year: number,
  month: number,
  events: CalendarEvent[],
  holidays: Holiday[],
  moonPhases: MoonPhase[],
  recurringEvents: { name: string; day: number }[] = [],
): CalendarGrid {
```

The default value `= []` means all existing callers work without changes.

Add placement logic after the moon phase placement block (around line 60):

```ts
// Place recurring events
for (const re of recurringEvents) {
  const cell = findCell(weeks, re.day)
  if (cell) cell.recurringEvents.push(re.name)
}
```

### Step 4c: Write tests

Add to `calendar.test.ts`:

```ts
test('recurring events are placed on correct days', () => {
  const recurring = [
    { name: 'CHURCH - 9 AM', day: 5 },
    { name: 'CHURCH - 9 AM', day: 12 },
    { name: 'CHURCH - 9 AM', day: 19 },
    { name: 'CHURCH - 9 AM', day: 26 },
  ]

  // January 2025: starts on Wednesday
  const grid = buildCalendarGrid(2025, 1, [], [], [], recurring)

  // Jan 5 is Sunday (row 1, col 0)
  expect(grid.weeks[1][0]!.recurringEvents).toEqual(['CHURCH - 9 AM'])
  // Jan 12 is Sunday (row 2, col 0)
  expect(grid.weeks[2][0]!.recurringEvents).toEqual(['CHURCH - 9 AM'])
})

test('recurring events coexist with regular events and holidays in same cell', () => {
  const events: CalendarEvent[] = [
    { id: '1', name: 'BECKY LEWIS', type: 'B', month: 1, day: 26, groups: ['Lewis'] },
  ]
  const holidays: Holiday[] = [
    { name: 'SOME HOLIDAY', month: 1, day: 26 },
  ]
  const recurring = [
    { name: 'CHURCH - 9 AM', day: 26 },
  ]

  const grid = buildCalendarGrid(2025, 1, events, holidays, [], recurring)

  // Jan 26 (Sunday, row 4, col 0)
  const jan26 = grid.weeks[4][0]!
  expect(jan26.events).toHaveLength(1)
  expect(jan26.holidays).toHaveLength(1)
  expect(jan26.recurringEvents).toEqual(['CHURCH - 9 AM'])
})

test('days without recurring events have empty recurringEvents array', () => {
  const grid = buildCalendarGrid(2025, 1, [], [], [], [])
  // Jan 1 is Wednesday (row 0, col 3)
  expect(grid.weeks[0][3]!.recurringEvents).toEqual([])
})
```

**Run tests. Commit.**

**Commit:** `Integrate recurring events into calendar grid`

---

## Phase 5: State Hook

**Goal:** Update `useCalendarState` to handle R events correctly in filtering and grid building.

**File: `src/hooks/useCalendarState.ts`**

### What changes

1. **`filteredEvents`**: Currently filters by `e.month === selectedMonth && e.groups.some(...)`. R events have month=0, so they'd never match. Change the filter:
   - B/A events: must match `selectedMonth` AND have an enabled group
   - R events: must have an enabled group (month is irrelevant — they apply to all months)

   ```ts
   const filteredEvents = useMemo(() => {
     const enabledSet = new Set(enabledGroups)
     return events.filter((e) => {
       if (!e.groups.some((g) => enabledSet.has(g))) return false
       if (e.type === 'R') return true
       return e.month === selectedMonth
     })
   }, [events, selectedMonth, enabledGroups])
   ```

   **Important:** `filteredEvents` is used in two places: (1) passed to `buildCalendarGrid` in `App.tsx`, and (2) displayed in the UI. For the grid, R events in `filteredEvents` are fine — they'll be ignored by the existing event placement code (month=0 won't match) and instead handled by the new recurring events path (see Phase 9). For the event list UI, R events should always be visible regardless of month — and this change accomplishes that.

### Step 5a: Write tests

Add to `useCalendarState.test.ts`:

```ts
test('filteredEvents includes R events regardless of selected month', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({
    name: 'CHURCH - 9 AM',
    type: 'R',
    month: 0,
    day: 0,
    groups: ['Hooper'],
    recurrence: { kind: 'weekly', dayOfWeek: 0 },
  }))
  act(() => result.current.addGroup('Hooper'))

  // R event should appear regardless of month
  act(() => result.current.setMonth(3))
  expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
  act(() => result.current.setMonth(8))
  expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
})

test('filteredEvents excludes R events when their group is disabled', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({
    name: 'CHURCH - 9 AM',
    type: 'R',
    month: 0,
    day: 0,
    groups: ['Hooper'],
    recurrence: { kind: 'weekly', dayOfWeek: 0 },
  }))
  act(() => result.current.addGroup('Hooper'))

  expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
  act(() => result.current.toggleGroup('Hooper'))
  expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(false)
})
```

**Run tests (they'll fail), implement the filter change, run tests again.**

**Commit:** `Update filteredEvents to include R events regardless of month`

---

## Phase 6: Preview and PDF Rendering

**Goal:** Render recurring events in the HTML preview and PDF.

### Step 6a: CalendarPreview

**File: `src/components/CalendarPreview.tsx`**

In the `DayCell` component, recurring events render as plain text (no prefix) between the regular events and the holidays. Add after the `cell.events.map(...)` block:

```tsx
{cell.recurringEvents.map((name, i) => (
  <div key={`recurring-${i}`} className="cell-event">
    {name}
  </div>
))}
```

**Note:** Recurring events render with the same CSS class as regular events. They're visually identical — just plain text. They do NOT get a "B:" or "A:" prefix.

**Wait — look at the existing rendering.** Line 64 in `CalendarPreview.tsx`:
```tsx
{event.type}: {event.name}
```

This means B/A events render as `"B: Amy Holland"`. Recurring events should NOT have a prefix. That's why they're in a separate array — the rendering code doesn't need to special-case them.

### Step 6b: CalendarPreview test

Add to `src/components/CalendarPreview.test.tsx`:

```ts
test('renders recurring events without type prefix', () => {
  // Build a grid with a recurring event
  const grid: CalendarGrid = {
    year: 2025,
    month: 1,
    weeks: [[
      {
        day: 5,
        events: [],
        holidays: [],
        moonPhases: [],
        recurringEvents: ['CHURCH - 9 AM'],
      },
      null, null, null, null, null, null,
    ]],
    overflowEvents: [],
  }

  render(<CalendarPreview grid={grid} title="JANUARY 2025" />)
  expect(screen.getByText('CHURCH - 9 AM')).toBeInTheDocument()
  // Should NOT have a type prefix
  expect(screen.queryByText(/[BA]: CHURCH/)).not.toBeInTheDocument()
})
```

**Important:** Check the existing CalendarPreview tests. They construct `CalendarDay` objects — you'll need to add `recurringEvents: []` to each one so they compile. Do this before writing your new test.

**Run tests, implement, commit.**

**Commit:** `Render recurring events in CalendarPreview`

### Step 6c: PDF rendering

**File: `src/lib/pdf.ts`**

In the `drawCellContent` function, recurring events render as plain text in the same style as B/A events, positioned between regular events and holidays (which are anchored to the bottom of the cell).

After the event-drawing loop (around line 270), add:

```ts
// Recurring events (plain text, no prefix)
for (const name of cell.recurringEvents) {
  const wrapped = doc.splitTextToSize(name, maxTextWidth) as string[]
  for (const line of wrapped) {
    if (cursorY >= bottomLimit) break
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(CONTENT_FONT_SIZE)
    doc.text(line, x + CELL_PADDING, cursorY, { baseline: 'top' })
    cursorY += eventLineHeight
  }
}
```

### Step 6d: PDF test

In `src/lib/pdf.test.ts`, add a test that generates a PDF with recurring events and verifies the text appears. Check the existing pdf tests to match their style — they use `doc.output('text')` or inspect the jsPDF internal state. Match that pattern.

**Run tests, commit.**

**Commit:** `Render recurring events in PDF`

---

## Phase 7: EventForm UI

**Goal:** When the user selects type "Recurring" in the EventForm, show recurrence fields instead of month/day.

**File: `src/components/EventForm.tsx`**

### What changes

1. The type dropdown gains a third option: `<option value="R">Recurring</option>`.

2. When `type === 'R'`:
   - **Hide** the Month and Day fields
   - **Show** recurrence fields:
     - Pattern dropdown: "Every week" / "Nth weekday of month"
     - Day of week dropdown: Sunday through Saturday
     - If pattern is "nth": Which occurrence dropdown: 1st through 5th

3. On submit:
   - If type is `R`: build a `RecurrenceRule` from the dropdowns, set month=0 and day=0, pass `recurrence` to `onAdd`
   - If type is `B` or `A`: behave exactly as today (no `recurrence` field)

4. Validation for R events: the recurrence fields always produce valid values (they're dropdowns with fixed options), so no additional validation is needed beyond the name check.

5. The `onAdd` callback type needs to accept the optional `recurrence` field. Check the type: it's `Omit<CalendarEvent, 'id'>`, which already includes the optional `recurrence?: RecurrenceRule`. So no type change needed.

### State additions

Add to the component's state:
```ts
const [recurrencePattern, setRecurrencePattern] = useState<'weekly' | 'nth'>('weekly')
const [dayOfWeek, setDayOfWeek] = useState(0)  // 0=Sunday
const [nthOccurrence, setNthOccurrence] = useState(1)
```

Reset these in `resetForm`.

### Day name constant

You need day names for the dropdown. Add a constant at the top of the file (or import from constants.ts if you add it there — your call, but check if it's used elsewhere first):
```ts
const DAY_OF_WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
```

### Step 7a: Write tests first

Add to `EventForm.test.tsx`:

```ts
test('selecting Recurring type shows recurrence fields and hides month/day', () => {
  render(<EventForm onAdd={() => {}} availableGroups={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))

  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'R' } })

  // Recurrence fields visible
  expect(screen.getByLabelText(/pattern/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/day of week/i)).toBeInTheDocument()

  // Month and Day fields hidden
  expect(screen.queryByLabelText(/^month$/i)).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/^day$/i)).not.toBeInTheDocument()
})

test('nth pattern shows occurrence dropdown', () => {
  render(<EventForm onAdd={() => {}} availableGroups={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'R' } })
  fireEvent.change(screen.getByLabelText(/pattern/i), { target: { value: 'nth' } })

  expect(screen.getByLabelText(/occurrence/i)).toBeInTheDocument()
})

test('submitting weekly recurring event calls onAdd correctly', () => {
  const onAdd = vi.fn()
  render(<EventForm onAdd={onAdd} availableGroups={['Hooper']} />)
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))

  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'CHURCH - 9 AM' } })
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'R' } })
  fireEvent.change(screen.getByLabelText(/day of week/i), { target: { value: '0' } })
  fireEvent.click(screen.getByLabelText('Hooper'))
  fireEvent.click(screen.getByRole('button', { name: /save event/i }))

  expect(onAdd).toHaveBeenCalledWith({
    name: 'CHURCH - 9 AM',
    type: 'R',
    month: 0,
    day: 0,
    groups: ['Hooper'],
    recurrence: { kind: 'weekly', dayOfWeek: 0 },
  })
})

test('submitting nth recurring event calls onAdd correctly', () => {
  const onAdd = vi.fn()
  render(<EventForm onAdd={onAdd} availableGroups={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))

  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'COMMUNION' } })
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'R' } })
  fireEvent.change(screen.getByLabelText(/pattern/i), { target: { value: 'nth' } })
  fireEvent.change(screen.getByLabelText(/occurrence/i), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText(/day of week/i), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: /save event/i }))

  expect(onAdd).toHaveBeenCalledWith({
    name: 'COMMUNION',
    type: 'R',
    month: 0,
    day: 0,
    groups: [],
    recurrence: { kind: 'nth', n: 1, dayOfWeek: 0 },
  })
})

test('switching from R back to B shows month/day fields again', () => {
  render(<EventForm onAdd={() => {}} availableGroups={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))

  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'R' } })
  expect(screen.queryByLabelText(/^month$/i)).not.toBeInTheDocument()

  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'B' } })
  expect(screen.getByLabelText(/month/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/day/i)).toBeInTheDocument()
})
```

**Careful with label matching:** the existing Month label is just "Month". The new "Day of week" label contains "day". Use regex anchors like `/^day$/i` to avoid conflicts, or adjust labels so they're unambiguous. Read the existing test patterns to see how they match labels.

### Step 7b: Implement

Update the `handleSubmit` to branch on type:
```ts
if (type === 'R') {
  const recurrence: RecurrenceRule =
    recurrencePattern === 'weekly'
      ? { kind: 'weekly', dayOfWeek }
      : { kind: 'nth', n: nthOccurrence, dayOfWeek }
  onAdd({ name, type, month: 0, day: 0, groups: selectedGroups, recurrence })
} else {
  if (!isValidDay(month, day)) { ... }
  onAdd({ name, type, month, day, groups: selectedGroups })
}
```

**Note on type widening:** The `type` state is currently `useState<EventType>('B')`. Since `EventType` now includes `'R'`, this should work. But the `select` onChange casts to `EventType` — check it still works: `setType(e.target.value as EventType)`. This is fine since the only values in the dropdown are `'B'`, `'A'`, `'R'`.

**Run tests, commit.**

**Commit:** `Add recurring event support to EventForm`

---

## Phase 8: EventList UI

**Goal:** Display R events properly in the event list, with human-readable recurrence descriptions and appropriate filtering.

**File: `src/components/EventList.tsx`**

### What changes

1. **Display:** For R events, instead of showing `(R) 0/0`, show the recurrence description. Import `formatRecurrenceRule` from `../lib/recurrence`. In the display span:
   ```tsx
   <span>
     {event.type === 'R' && event.recurrence
       ? ` (R) ${formatRecurrenceRule(event.recurrence)}`
       : ` (${event.type}) ${event.month}/${event.day}`}
   </span>
   ```

2. **Type filter dropdown:** Add `<option value="R">Recurring</option>`.

3. **Month filter:** R events should always pass the month filter:
   ```ts
   if (filterMonth && e.type !== 'R' && e.month !== filterMonth) return false
   ```

4. **Inline editing:** When editing an R event, show recurrence fields instead of month/day (same pattern as EventForm). This adds complexity. The inline edit state needs:
   ```ts
   const [editRecurrencePattern, setEditRecurrencePattern] = useState<'weekly' | 'nth'>('weekly')
   const [editDayOfWeek, setEditDayOfWeek] = useState(0)
   const [editNthOccurrence, setEditNthOccurrence] = useState(1)
   ```

   In `startEdit`, populate these from the event's recurrence rule:
   ```ts
   if (event.type === 'R' && event.recurrence) {
     setEditRecurrencePattern(event.recurrence.kind)
     setEditDayOfWeek(event.recurrence.dayOfWeek)
     if (event.recurrence.kind === 'nth') {
       setEditNthOccurrence(event.recurrence.n)
     }
   }
   ```

   In `saveEdit`, build the recurrence rule from the edit state and include it in the update.

### Step 8a: Write tests

Add to `EventList.test.tsx`:

```ts
test('R events display recurrence description instead of month/day', () => {
  const recurringEvents: CalendarEvent[] = [
    {
      id: '1', name: 'CHURCH - 9 AM', type: 'R', month: 0, day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    },
  ]
  render(<EventList events={recurringEvents} onUpdate={() => {}} onDelete={() => {}} availableGroups={['Hooper']} />)
  expect(screen.getByText(/Every Sunday/)).toBeInTheDocument()
  expect(screen.queryByText('0/0')).not.toBeInTheDocument()
})

test('R events are not hidden by month filter', () => {
  const mixedEvents: CalendarEvent[] = [
    { id: '1', name: 'Alice', type: 'B', month: 3, day: 15, groups: ['Family'] },
    {
      id: '2', name: 'CHURCH', type: 'R', month: 0, day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    },
  ]
  render(<EventList events={mixedEvents} onUpdate={() => {}} onDelete={() => {}} availableGroups={['Family', 'Hooper']} />)

  // Filter to June — Alice (March) should disappear, CHURCH should remain
  fireEvent.change(screen.getByDisplayValue('All Months'), { target: { value: '6' } })
  expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  expect(screen.getByText('CHURCH')).toBeInTheDocument()
})

test('type filter can select Recurring events', () => {
  const mixedEvents: CalendarEvent[] = [
    { id: '1', name: 'Alice', type: 'B', month: 3, day: 15, groups: ['Family'] },
    {
      id: '2', name: 'CHURCH', type: 'R', month: 0, day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    },
  ]
  render(<EventList events={mixedEvents} onUpdate={() => {}} onDelete={() => {}} availableGroups={['Family', 'Hooper']} />)

  fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'R' } })
  expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  expect(screen.getByText('CHURCH')).toBeInTheDocument()
})
```

**Run tests (fail), implement, run tests (pass), commit.**

**Commit:** `Add recurring event display and filtering to EventList`

### Step 8b: Inline edit for R events

This is optional complexity. If the inline edit for R events feels like too much for one phase, it's acceptable to disable editing for R events in the first pass (hide the Edit button for R events) and add it later. But ideally, implement it now.

Write a test:
```ts
test('inline edit of R event shows recurrence fields', () => {
  const onUpdate = vi.fn()
  const recurringEvents: CalendarEvent[] = [
    {
      id: '1', name: 'CHURCH', type: 'R', month: 0, day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    },
  ]
  render(<EventList events={recurringEvents} onUpdate={onUpdate} onDelete={() => {}} availableGroups={['Hooper']} />)

  fireEvent.click(screen.getByRole('button', { name: /edit/i }))
  // Should see recurrence fields, not month/day
  expect(screen.getByLabelText(/day of week/i)).toBeInTheDocument()
  expect(screen.queryByLabelText(/^month$/i)).not.toBeInTheDocument()
})
```

**Implement, test, commit.**

**Commit:** `Add inline edit support for recurring events in EventList`

---

## Phase 9: App Wiring

**Goal:** Connect recurring event expansion to the calendar grid in `App.tsx`.

**File: `src/App.tsx`**

### What changes

Currently `App.tsx` does:
```ts
const grid = buildCalendarGrid(
  state.selectedYear, state.selectedMonth,
  state.filteredEvents, holidays, moonPhases,
)
```

Add the expansion step:
```ts
import { expandRecurringEvents } from './lib/recurrence'

// ... inside App():
const expandedRecurring = expandRecurringEvents(
  state.filteredEvents, state.selectedYear, state.selectedMonth,
)
const grid = buildCalendarGrid(
  state.selectedYear, state.selectedMonth,
  state.filteredEvents, holidays, moonPhases, expandedRecurring,
)
```

That's it. The R events in `filteredEvents` will be ignored by the grid's event placement (month=0 won't match), and the expanded recurring events will be placed by the new recurring events placement code added in Phase 4.

### Test

Add to `App.test.tsx`:

```ts
test('recurring events appear on the correct days in the preview', async () => {
  render(<App />)

  // Navigate to events tab, upload a CSV with an R event
  // ... (follow the existing App test patterns for CSV upload)
  // Then verify the preview shows the recurring event text on the right days
})
```

Check the existing `App.test.tsx` to understand how it tests CSV upload and preview rendering. Match that pattern. The test should:
1. Upload a CSV with at least one R event (e.g., `CHURCH - 9 AM,R,,,Hooper,weekly:Sunday`)
2. Verify the preview renders "CHURCH - 9 AM" on every Sunday of the selected month

**Run full test suite. Commit.**

**Commit:** `Wire recurring event expansion into App`

---

## Phase 10: Validation Against Example PDF

**Goal:** Verify that the church events from `examples/JANUARY 2025 - C.pdf` are reproduced correctly.

**File: `src/lib/recurrence.test.ts` (add a new describe block)**

The example PDF shows January 2025 with these recurring events:
- CHURCH - 9 AM: every Sunday → days 5, 12, 19, 26
- SUNDAY SCHOOL 10:15 AM: every Sunday → days 5, 12, 19, 26
- 7:00 PM - CHURCH ADULT BIBLE STUDY: every Tuesday → days 7, 14, 21, 28
- COMMUNION: 1st Sunday → day 5

Write a test that creates these as `CalendarEvent` objects, calls `expandRecurringEvents` for January 2025, and asserts the exact output:

```ts
describe('validation against January 2025 church calendar', () => {
  const churchEvents: CalendarEvent[] = [
    { id: '1', name: 'CHURCH - 9 AM', type: 'R', month: 0, day: 0, groups: ['Hooper'], recurrence: { kind: 'weekly', dayOfWeek: 0 } },
    { id: '2', name: 'SUNDAY SCHOOL 10:15 AM', type: 'R', month: 0, day: 0, groups: ['Hooper'], recurrence: { kind: 'weekly', dayOfWeek: 0 } },
    { id: '3', name: '7:00 PM - CHURCH ADULT BIBLE STUDY', type: 'R', month: 0, day: 0, groups: ['Hooper'], recurrence: { kind: 'weekly', dayOfWeek: 2 } },
    { id: '4', name: 'COMMUNION', type: 'R', month: 0, day: 0, groups: ['Hooper'], recurrence: { kind: 'nth', n: 1, dayOfWeek: 0 } },
  ]

  test('CHURCH - 9 AM appears every Sunday', () => {
    const expanded = expandRecurringEvents(churchEvents, 2025, 1)
    const churchDays = expanded.filter(e => e.name === 'CHURCH - 9 AM').map(e => e.day)
    expect(churchDays).toEqual([5, 12, 19, 26])
  })

  test('SUNDAY SCHOOL appears every Sunday', () => {
    const expanded = expandRecurringEvents(churchEvents, 2025, 1)
    const ssDays = expanded.filter(e => e.name === 'SUNDAY SCHOOL 10:15 AM').map(e => e.day)
    expect(ssDays).toEqual([5, 12, 19, 26])
  })

  test('ADULT BIBLE STUDY appears every Tuesday', () => {
    const expanded = expandRecurringEvents(churchEvents, 2025, 1)
    const absDays = expanded.filter(e => e.name === '7:00 PM - CHURCH ADULT BIBLE STUDY').map(e => e.day)
    expect(absDays).toEqual([7, 14, 21, 28])
  })

  test('COMMUNION appears only on the first Sunday', () => {
    const expanded = expandRecurringEvents(churchEvents, 2025, 1)
    const communionDays = expanded.filter(e => e.name === 'COMMUNION').map(e => e.day)
    expect(communionDays).toEqual([5])
  })
})
```

**Run tests. They should pass (the logic was implemented in Phase 2). Commit.**

**Commit:** `Add validation tests against January 2025 church calendar`

---

## Final Checklist

Before considering this feature complete:

- [ ] `npm test` passes with 0 failures
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All new files have ABOUTME headers
- [ ] CSV round-trip works: parse R events → export → parse again → same data
- [ ] Backward compatibility: 5-column CSVs parse correctly
- [ ] Loading `data/initial-events.csv` (which has no Recurrence column) still works
- [ ] The HTML preview shows recurring events on the correct days
- [ ] The PDF renders recurring events (generate one to `/tmp/` and eyeball it)
- [ ] The EventForm can create R events
- [ ] The EventList displays R events with recurrence descriptions
- [ ] The EventList month filter does not hide R events
- [ ] Group filtering works for R events (toggle group off → R events in that group disappear)
- [ ] No regressions in existing functionality

Generate a test PDF to visually verify:
1. Start dev server: `npm run dev`
2. Upload `data/initial-events.csv`
3. Manually add the 4 church events via the EventForm (type: Recurring)
4. Navigate to January 2025
5. Download PDF
6. Compare against `examples/JANUARY 2025 - C.pdf`
