# Soft-Delete Events — Implementation Plan

This is the step-by-step build plan for the soft-delete feature. **Read the
design spec first:** [`soft-delete-events.md`](./soft-delete-events.md). This
document assumes you have read it and refers back to its decisions.

This plan assumes you are a capable developer but new to this codebase, its
toolset, and its problem domain. It spells out everything: which files to touch,
what code to write, what tests to write *first*, and how to run them. Follow it
top to bottom. Each task is a complete TDD cycle that ends in a commit.

---

## 0. Orientation (read before writing any code)

### What this app is

Papa's Calendar is a client-side React app that turns a CSV of birthdays /
anniversaries / recurring events into a printable monthly calendar PDF. There is
no backend. All data lives in the user's CSV file and the browser session.

### The architecture rule that governs everything

**All business logic lives in `src/lib/` as pure functions with no React
dependency.** Components and hooks are thin and call into `lib/`. When you add
logic, it goes in `lib/` (or the state hook), not in a component. Tests for pure
functions are fast and simple; lean on them.

The data flow you are modifying:

```
CSV text ──parseEventsFromCsv──► CalendarEvent[] ──┐
                                                    │ (in useCalendarState)
                          filter out deleted ◄──────┘
                                  │
                          filteredEvents ──buildCalendarGrid──► PDF / preview
```

### Files you will touch

| File | Why |
|---|---|
| `src/types.ts` | Add the `deleted` field to `CalendarEvent` |
| `src/lib/csv.ts` | Parse + export the new `Deleted` column; dedup change |
| `src/lib/csv.test.ts` | Tests for the above |
| `src/hooks/useCalendarState.ts` | Soft-delete, restore, derived lists, group seeding |
| `src/hooks/useCalendarState.test.ts` | Tests for the above |
| `src/components/DeletedEventList.tsx` | **New** — the Deleted section UI |
| `src/components/DeletedEventList.test.tsx` | **New** — tests for it |
| `src/App.tsx` | Wire the new list + point counts at the right lists |
| `src/App.test.tsx` | Integration test for delete → restore |
| `docs/user-manual.md` | Document the feature |
| `docs/improvements.md` | Mark the feature done |

### Domain vocabulary you need

- **`CalendarEvent`** (`src/types.ts`): one row of the CSV in memory. Has
  `id`, `name`, `type` (`'B'` birthday / `'A'` anniversary / `'R'` recurring),
  `month`, `day`, `groups: string[]`, optional `recurrence`. You will add
  optional `deleted?: boolean`.
- **`groups`**: free-text tags on an event (e.g. `"Lewis"`, `"Hooper"`). The user
  filters the calendar by group. An event shows on the calendar only if at least
  one of its groups is currently enabled.
- **Recurring (`R`) events**: have no fixed date (`month`/`day` are `0`); they
  carry a `recurrence` rule (`weekly:Sunday`, `nth:1:Sunday`). Helpers in
  `src/lib/recurrence.ts` parse, serialize, and format these.

### Commands

```bash
npm test                                  # run the whole suite once (vitest run)
npx vitest run src/lib/csv.test.ts        # run one test file
npx vitest run -t "parses a deleted row"  # run one test by name
npx tsc --noEmit                          # type-check, no output files
npm run build                             # production build (do this at the end)
npm run dev                               # local dev server for a manual look
```

There is **no watch mode in CI**; `npm test` runs once and exits. Run the
relevant file after each change.

---

## Test design — read this once, apply it everywhere

You will write a lot of tests. Bad tests are worse than no tests because they
give false confidence and break on every refactor. Follow these rules:

1. **One behavior per test.** A test name is a sentence: `it('parses a row with
   Deleted=true as deleted', ...)`. If you need "and" in the name, it's probably
   two tests.
2. **Arrange → Act → Assert**, with blank lines between the three. Look at the
   existing tests in `csv.test.ts` — they all follow this shape. Match it.
3. **Test real logic, never mocked behavior.** Our `lib/` functions are pure —
   call them with real inputs and assert on real outputs. Do **not** mock
   `parseEventsFromCsv`, the hook, or anything you are testing. (Mocking the
   thing under test and asserting it was called is the classic worthless test.)
4. **Test the contract, including failure.** For the parser, that means: valid
   input produces the right event, *and* invalid input produces the right error
   message and skips the row. Error paths are not optional extras — they are half
   the spec.
5. **Assert on specifics, not just counts.** `expect(events).toHaveLength(1)` is
   a start; also assert the field you care about (`expect(events[0].deleted).toBe(
   true)`). A length check alone passes for the wrong reasons.
6. **Pristine output.** Test runs must be clean — no stray `console.log`, no
   unhandled warnings. If a test intentionally exercises an error, assert on the
   captured error (we collect parser errors into a returned `errors` array — see
   below — so there is nothing to silence; assert on the array).
7. **Don't test the framework.** No need to test that React renders a `<button>`.
   Test *our* behavior: that clicking Restore calls our handler with the right id,
   that a deleted event is absent from the active list, etc.

### Toolset primer

- **Vitest** is the runner. `describe`/`it`/`test`, `expect(...).toBe/.toEqual/
  .toContain/.toHaveLength`. `toBe` is identity (use for primitives); `toEqual`
  is deep equality (use for arrays/objects). Both `it` and `test` exist in this
  repo — match the file you're editing (`csv.test.ts` uses `it`,
  `useCalendarState.test.ts` uses `test`).
- **React Testing Library (RTL)** for components: `render(<C .../>)`, then query
  with `screen.getByText`, `screen.getByRole('button', { name: /restore/i })`,
  `screen.queryByText` (returns `null` if absent — use for "should NOT be
  there"). Simulate input with `fireEvent.click(...)` / `fireEvent.change(...)`.
  Study `src/App.test.tsx` for the exact idioms.
- **`renderHook` + `act`** for testing the state hook without a component:
  `const { result } = renderHook(() => useCalendarState())`, read state via
  `result.current.x`, and wrap every state change in `act(() => result.current
  .doThing())`. The whole `useCalendarState.test.ts` file is your template.

---

## Version control

- Create a working branch before you start: `git checkout -b
  soft-delete-events`.
- Commit after **each** task below (every task ends green: tests pass +
  `npx tsc --noEmit` clean). Frequent commits are required, not optional.
- Use the suggested commit subject at the end of each task.
- Never use `git add -A` without first running `git status` and confirming you
  are only staging files you meant to.

---

## Task 1 — Add the `deleted` field and parse the `Deleted` column

**Goal:** `parseEventsFromCsv` reads a 7th `Deleted` column and sets `deleted`
on the event. Active and deleted duplicates are kept distinct (spec: "Treat
deleted vs. active as distinct").

**Files:** `src/types.ts`, `src/lib/csv.ts`, `src/lib/csv.test.ts`.

### Step 1a — the type

In `src/types.ts`, add one optional field to `CalendarEvent` (mirror how
`recurrence?` is optional — active events simply omit it):

```ts
export interface CalendarEvent {
  id: string
  name: string
  type: EventType
  month: number
  day: number
  groups: string[]
  recurrence?: RecurrenceRule
  deleted?: boolean
}
```

### Step 1b — write the failing tests first

Add these to the `describe('parseEventsFromCsv', ...)` block in
`src/lib/csv.test.ts`. Run them and watch them fail before touching `csv.ts`.

```ts
it('parses a row with Deleted=true as deleted', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Old Coworker,B,5,9,Work,,true`

  const result = parseEventsFromCsv(csv)

  expect(result.events).toHaveLength(1)
  expect(result.errors).toEqual([])
  expect(result.events[0].deleted).toBe(true)
})

it('parses a blank Deleted value as active (deleted undefined)', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,`

  const result = parseEventsFromCsv(csv)

  expect(result.events[0].deleted).toBeUndefined()
})

it('parses Deleted=false (any case) as active', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,FALSE`

  const result = parseEventsFromCsv(csv)

  expect(result.events[0].deleted).toBeUndefined()
})

it('treats Deleted=true case-insensitively', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Old Coworker,B,5,9,Work,,TRUE`

  const result = parseEventsFromCsv(csv)

  expect(result.events[0].deleted).toBe(true)
})

it('keeps a deleted row and an identical active row as distinct events', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
John,B,3,15,Family,,true
John,B,3,15,Family,,`

  const result = parseEventsFromCsv(csv)

  expect(result.events).toHaveLength(2)
  const deleted = result.events.filter((e) => e.deleted)
  const active = result.events.filter((e) => !e.deleted)
  expect(deleted).toHaveLength(1)
  expect(active).toHaveLength(1)
})

it('merges groups of two matching deleted rows', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
John,B,3,15,Family,,true
John,B,3,15,Friends,,true`

  const result = parseEventsFromCsv(csv)

  expect(result.events).toHaveLength(1)
  expect(result.events[0].deleted).toBe(true)
  expect(result.events[0].groups).toEqual(['Family', 'Friends'])
})
```

### Step 1c — make them pass

In `src/lib/csv.ts`, inside the row loop, **after** the `isValidType` check and
before the `if (type === 'R')` branch, read the flag. For this task, keep it
**lenient** — only `true` (case-insensitive) means deleted; everything else is
active:

```ts
const type = rawType as EventType

const deleted = (row.Deleted ?? '').trim().toLowerCase() === 'true'
```

This is deliberately permissive: a garbage value like `maybe` parses as active
for now. Task 2 tightens this into strict validation (rejecting unsupported
values), test-first — so don't add error handling here yet.

Now thread `deleted` into the dedup key and the pushed object, in **both**
branches. For the dated (B/A) branch:

```ts
const dedupKey = `${name.toLowerCase()}|${type}|${month}|${day}|${deleted}`
if (seen.has(dedupKey)) {
  const existing = events.find(
    (e) => `${e.name.toLowerCase()}|${e.type}|${e.month}|${e.day}|${e.deleted ?? false}` === dedupKey,
  )!
  // ...existing group-merge loop is unchanged...
  continue
}
seen.add(dedupKey)
const base = { id: crypto.randomUUID(), name, type, month, day, groups }
events.push(deleted ? { ...base, deleted: true } : base)
```

For the `R` branch, do the same: append `|${deleted}` to its `dedupKey`, append
`|${e.deleted ?? false}` to the `find` callback's reconstructed key, and push
`deleted ? { ...base, deleted: true } : base` where `base` includes
`recurrence`.

**Why `deleted ?? false` in the `find`:** active events omit the field
(`undefined`); `?? false` normalizes it so the reconstructed key matches the
boolean rendered into `dedupKey`. **Why append to the key at all:** that is what
makes an active and a deleted row with the same name/type/date hash to *different*
buckets, so they don't merge (spec decision Q5).

### Step 1d — run and commit

```bash
npx vitest run src/lib/csv.test.ts
npx tsc --noEmit
```

All green → `git commit` with subject: **"Parse Deleted column into CalendarEvent"**

---

## Task 2 — Reject invalid `Deleted` values

**Goal:** any nonblank `Deleted` value other than `true`/`false` is a parse error
that skips the row, with message `Row N: invalid Deleted value "..."` (spec:
"Parsing the `Deleted` value"). Task 1 left this lenient (garbage → active), so
these tests fail first; you implement the strict validation to make them pass.

**Files:** `src/lib/csv.ts`, `src/lib/csv.test.ts`.

### Write the failing tests first

```ts
it('reports an error and skips a row with a garbage Deleted value', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Amy Holland,B,2,4,Lewis,,maybe`

  const result = parseEventsFromCsv(csv)

  expect(result.events).toHaveLength(0)
  expect(result.errors).toEqual(['Row 2: invalid Deleted value "maybe"'])
})

it('rejects truthy-looking but unsupported Deleted values like "1" and "yes"', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
A,B,2,4,Lewis,,1
C,B,2,5,Lewis,,yes`

  const result = parseEventsFromCsv(csv)

  expect(result.events).toHaveLength(0)
  expect(result.errors).toEqual([
    'Row 2: invalid Deleted value "1"',
    'Row 3: invalid Deleted value "yes"',
  ])
})
```

Run `npx vitest run src/lib/csv.test.ts` and confirm the two new tests **fail**
(Task 1's lenient parse treats `maybe`/`1`/`yes` as active, so the row survives
and no error is reported).

### Make them pass

Replace the lenient one-liner from Task 1 with strict validation. The error path
mirrors the parser's existing fields (`Type`/`Month`/`Day`): push an error and
`continue` to skip the row.

```ts
const rawDeleted = (row.Deleted ?? '').trim()
const normalizedDeleted = rawDeleted.toLowerCase()
let deleted: boolean
if (normalizedDeleted === 'true') {
  deleted = true
} else if (normalizedDeleted === '' || normalizedDeleted === 'false') {
  deleted = false
} else {
  errors.push(`Row ${rowNum}: invalid Deleted value "${rawDeleted}"`)
  continue
}
```

Note the error message uses `rawDeleted` (trimmed, original case), not the
lower-cased form, so `"Yes"` reports as `"Yes"`. Run the whole csv file again and
confirm green:

```bash
npx vitest run src/lib/csv.test.ts
npx tsc --noEmit
```

**Commit:** **"Reject invalid Deleted values in CSV parse"**

---

## Task 3 — Export the `Deleted` column

**Goal:** `exportEventsToCsv` writes a 7th `Deleted` column: `true` for deleted
events, blank for active. A parse→export→parse round-trip preserves the deleted
flag.

**Files:** `src/lib/csv.ts`, `src/lib/csv.test.ts`.

### Write the failing tests

Add to the `describe('exportEventsToCsv', ...)` block:

```ts
it('writes the Deleted column header', () => {
  const csv = exportEventsToCsv([
    { id: '1', name: 'Amy', type: 'B', month: 2, day: 4, groups: ['Lewis'] },
  ])

  expect(csv).toContain('Name,Type,Month,Day,Groups,Recurrence,Deleted')
})

it('writes true for deleted events and blank for active ones', () => {
  const csv = exportEventsToCsv([
    { id: '1', name: 'Active One', type: 'B', month: 1, day: 1, groups: ['Lewis'] },
    { id: '2', name: 'Deleted One', type: 'B', month: 1, day: 2, groups: ['Lewis'], deleted: true },
  ])
  // PapaParse emits CRLF line endings; split on /\r?\n/ so no trailing \r
  // survives into the strings (the existing export tests sidestep this by using
  // toContain — we want exact matches here, so we strip the \r at the split).
  const lines = csv.trim().split(/\r?\n/)

  expect(lines[1]).toBe('Active One,B,1,1,Lewis,,')
  expect(lines[2]).toBe('Deleted One,B,1,2,Lewis,,true')
})

it('round-trips the deleted flag through export and re-parse', () => {
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Active One,B,1,1,Lewis,,
Deleted One,B,1,2,Lewis,,true`

  const { events } = parseEventsFromCsv(csv)
  const reparsed = parseEventsFromCsv(exportEventsToCsv(events)).events

  expect(reparsed.find((e) => e.name === 'Active One')!.deleted).toBeUndefined()
  expect(reparsed.find((e) => e.name === 'Deleted One')!.deleted).toBe(true)
})
```

### Make them pass

In `exportEventsToCsv`, add the field to the row object and the column to the
`columns` array (do **not** change `compareByDate` — deleted events interleave by
date, that's intended):

```ts
const rows = [...events].sort(compareByDate).map((e) => ({
  Name: e.name,
  Type: e.type,
  Month: e.type === 'R' ? '' : e.month,
  Day: e.type === 'R' ? '' : e.day,
  Groups: e.groups.join(','),
  Recurrence: e.recurrence ? serializeRecurrenceRule(e.recurrence) : '',
  Deleted: e.deleted ? 'true' : '',
}))

return Papa.unparse(rows, {
  columns: ['Name', 'Type', 'Month', 'Day', 'Groups', 'Recurrence', 'Deleted'],
})
```

**Note on existing tests:** the existing export tests use
`expect(csv).toContain('Amy Holland,B,2,4,Lewis')` — still true as a substring of
`Amy Holland,B,2,4,Lewis,,`, so they keep passing. Run the **whole** csv file to
confirm you didn't break them:

```bash
npx vitest run src/lib/csv.test.ts
npx tsc --noEmit
```

**Commit:** **"Export Deleted column in CSV"**

---

## Task 4 — Make `deleteEvent` soft-delete, add `restoreEvent` (simple case), add derived lists

**Goal:** in the state hook, deletion flips a flag instead of removing the event;
`filteredEvents` (what the calendar sees) excludes deleted events; new
`activeEvents` and `deletedEvents` derived lists exist; a basic `restoreEvent`
un-deletes. (The merge-on-restore case is Task 5.)

**Files:** `src/hooks/useCalendarState.ts`, `src/hooks/useCalendarState.test.ts`.

### Background

`useCalendarState` holds the single `events` array and exposes derived values via
`useMemo`. Read the existing file end-to-end before editing. Key existing pieces:
`filteredEvents` (line ~36) feeds the calendar; `deleteEvent` (line ~71)
currently filters the event out.

### Update the one existing test that encodes the old behavior

The existing test `deleteEvent removes an event` asserts the event is *gone*.
That behavior is intentionally changing. **Replace** that test (don't delete the
coverage) with one that asserts the new contract:

```ts
test('deleteEvent marks an event deleted but keeps it in events', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({
    name: 'Frank', type: 'A', month: 7, day: 4, groups: ['Work'],
  }))
  const id = result.current.events[0].id

  act(() => result.current.deleteEvent(id))

  expect(result.current.events).toHaveLength(1)
  expect(result.current.events[0].deleted).toBe(true)
})
```

### Write the new failing tests

```ts
test('filteredEvents excludes deleted events', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({
    name: 'Gone', type: 'B', month: 5, day: 1, groups: ['Work'],
  }))
  act(() => result.current.addGroup('Work'))
  act(() => result.current.setMonth(5))
  const id = result.current.events[0].id

  act(() => result.current.deleteEvent(id))

  expect(result.current.filteredEvents.some((e) => e.name === 'Gone')).toBe(false)
})

test('activeEvents and deletedEvents split the events list', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ name: 'Keep', type: 'B', month: 1, day: 1, groups: [] }))
  act(() => result.current.addEvent({ name: 'Trash', type: 'B', month: 2, day: 2, groups: [] }))
  const trashId = result.current.events.find((e) => e.name === 'Trash')!.id

  act(() => result.current.deleteEvent(trashId))

  expect(result.current.activeEvents.map((e) => e.name)).toEqual(['Keep'])
  expect(result.current.deletedEvents.map((e) => e.name)).toEqual(['Trash'])
})

test('restoreEvent un-deletes an event', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ name: 'Back', type: 'B', month: 1, day: 1, groups: [] }))
  const id = result.current.events[0].id
  act(() => result.current.deleteEvent(id))

  act(() => result.current.restoreEvent(id))

  expect(result.current.events[0].deleted).toBe(false)
  expect(result.current.deletedEvents).toHaveLength(0)
})
```

### Make them pass

In `useCalendarState.ts`:

1. Change `deleteEvent` to flip the flag:

```ts
const deleteEvent = useCallback((id: string) => {
  setEvents((prev) =>
    prev.map((e) => (e.id === id ? { ...e, deleted: true } : e)),
  )
}, [])
```

2. Add a basic `restoreEvent` (Task 5 extends this — leave a clear seam):

```ts
const restoreEvent = useCallback((id: string) => {
  setEvents((prev) =>
    prev.map((e) => (e.id === id ? { ...e, deleted: false } : e)),
  )
}, [])
```

3. Add the guard at the top of `filteredEvents`:

```ts
const filteredEvents = useMemo(() => {
  const enabledSet = new Set(enabledGroups)
  return events.filter((e) => {
    if (e.deleted) return false
    if (!e.groups.some((g) => enabledSet.has(g))) return false
    if (e.type === 'R') return true
    return e.month === selectedMonth
  })
}, [events, selectedMonth, enabledGroups])
```

4. Add two derived lists. `deletedEvents` is sorted by date (spec: "in date
   order"). Reuse the existing comparator — **export it from `csv.ts`** rather
   than re-implementing (DRY). In `csv.ts` change `function compareByDate` to
   `export function compareByDate`, then in the hook:

```ts
import { parseEventsFromCsv, compareByDate } from '../lib/csv'

const activeEvents = useMemo(
  () => events.filter((e) => !e.deleted),
  [events],
)

const deletedEvents = useMemo(
  () => events.filter((e) => e.deleted).sort(compareByDate),
  [events],
)
```

5. Return `restoreEvent`, `activeEvents`, and `deletedEvents` from the hook's
   return object.

Run `npx vitest run src/hooks/useCalendarState.test.ts && npx tsc --noEmit`.

**Commit:** **"Soft-delete events and expose active/deleted lists in state"**

---

## Task 5 — Merge-on-restore for identical active twins

**Goal:** restoring a deleted event that has an identical active twin merges the
deleted event's groups into the twin and drops the deleted record, instead of
producing two identical active events (spec: "Restore and calendar visibility").

**Files:** `src/hooks/useCalendarState.ts`, `src/hooks/useCalendarState.test.ts`.

### Background

"Identical" is compared with a normalized key (spec: lower-cased name, plus
`month|day` for B/A or the serialized recurrence rule for R). You'll add a small
module-level helper for this in the hook file. It mirrors the parser's dedup but
operates on `CalendarEvent` objects; keeping it local is fine (the parser builds
its keys from raw CSV strings, so there's no clean shared function to reuse
without refactoring working code — out of scope, YAGNI).

### Write the failing tests

```ts
test('restoreEvent merges into an identical active twin instead of duplicating', () => {
  const { result } = renderHook(() => useCalendarState())
  // active twin with one group
  act(() => result.current.addEvent({ name: 'John', type: 'B', month: 3, day: 15, groups: ['Family'] }))
  // a second John we will delete, carrying a different group
  act(() => result.current.addEvent({ name: 'John', type: 'B', month: 3, day: 15, groups: ['Friends'] }))
  const secondId = result.current.events[1].id
  act(() => result.current.deleteEvent(secondId))

  act(() => result.current.restoreEvent(secondId))

  const johns = result.current.events.filter((e) => e.name === 'John')
  expect(johns).toHaveLength(1)
  expect(johns[0].deleted).toBeFalsy()
  expect(johns[0].groups).toEqual(['Family', 'Friends'])
})

test('restoreEvent matches recurring twins by serialized recurrence', () => {
  const church = {
    name: 'CHURCH', type: 'R' as const, month: 0, day: 0,
    recurrence: { kind: 'weekly' as const, dayOfWeek: 0 },
  }
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ ...church, groups: ['Hooper'] }))
  act(() => result.current.addEvent({ ...church, groups: ['Lewis'] }))
  const secondId = result.current.events[1].id
  act(() => result.current.deleteEvent(secondId))

  act(() => result.current.restoreEvent(secondId))

  const churches = result.current.events.filter((e) => e.name === 'CHURCH')
  expect(churches).toHaveLength(1)
  expect(churches[0].groups).toEqual(['Hooper', 'Lewis'])
})
```

### Make it pass

At module scope in `useCalendarState.ts` (top of file, after imports — add
`import { serializeRecurrenceRule } from '../lib/recurrence'`):

```ts
// Identity used to detect an active duplicate of a restored event.
// Mirrors the CSV dedup: lower-cased name + date (or serialized recurrence for R).
function eventIdentityKey(e: CalendarEvent): string {
  const datePart =
    e.type === 'R' && e.recurrence
      ? serializeRecurrenceRule(e.recurrence)
      : `${e.month}|${e.day}`
  return `${e.name.toLowerCase()}|${e.type}|${datePart}`
}
```

Replace `restoreEvent`:

```ts
const restoreEvent = useCallback((id: string) => {
  setEvents((prev) => {
    const target = prev.find((e) => e.id === id)
    if (!target) return prev

    const key = eventIdentityKey(target)
    const twin = prev.find(
      (e) => e.id !== id && !e.deleted && eventIdentityKey(e) === key,
    )

    if (!twin) {
      return prev.map((e) => (e.id === id ? { ...e, deleted: false } : e))
    }

    const mergedGroups = [...twin.groups]
    for (const g of target.groups) {
      if (!mergedGroups.includes(g)) mergedGroups.push(g)
    }
    return prev
      .filter((e) => e.id !== id)
      .map((e) => (e.id === twin.id ? { ...e, groups: mergedGroups } : e))
  })
}, [])
```

Run the hook tests + `npx tsc --noEmit`.

**Commit:** **"Merge restored events into identical active twins"**

---

## Task 6 — Seed enabled groups and available groups from active events only

**Goal:** `availableGroups` and the group seeding in `loadEventsFromCsv` ignore
deleted events, so a group that exists only on deleted rows is not silently
enabled/invisible (spec: the `loadEventsFromCsv` bullet and "Restore and calendar
visibility").

**Files:** `src/hooks/useCalendarState.ts`, `src/hooks/useCalendarState.test.ts`.

### Write the failing tests

```ts
test('availableGroups ignores groups that exist only on deleted events', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ name: 'Ghost', type: 'B', month: 1, day: 1, groups: ['DeletedOnly'] }))
  const id = result.current.events[0].id

  act(() => result.current.deleteEvent(id))

  expect(result.current.availableGroups).not.toContain('DeletedOnly')
})

test('loadEventsFromCsv does not enable groups that exist only on deleted rows', () => {
  const { result } = renderHook(() => useCalendarState())
  const csv = `Name,Type,Month,Day,Groups,Recurrence,Deleted
Active,B,1,1,Live,,
Gone,B,2,2,DeletedOnly,,true`

  act(() => result.current.loadEventsFromCsv(csv))

  expect(result.current.enabledGroups).toContain('Live')
  expect(result.current.enabledGroups).not.toContain('DeletedOnly')
})
```

### Make it pass

Two edits in `useCalendarState.ts`:

1. `availableGroups` — iterate only non-deleted events:

```ts
const availableGroups = useMemo(() => {
  const groups = new Set<string>()
  for (const e of events) {
    if (e.deleted) continue
    for (const g of e.groups) groups.add(g)
  }
  for (const g of customGroups) groups.add(g)
  return Array.from(groups).sort()
}, [events, customGroups])
```

2. `loadEventsFromCsv` — seed `enabledGroups` from non-deleted parsed events:

```ts
const loadEventsFromCsv = useCallback((csvString: string) => {
  const { events: parsed, errors } = parseEventsFromCsv(csvString)
  setEvents(parsed)
  setCsvErrors(errors)
  const groups = new Set<string>()
  for (const e of parsed) {
    if (e.deleted) continue
    for (const g of e.groups) groups.add(g)
  }
  setEnabledGroups(Array.from(groups).sort())
}, [])
```

Run the hook tests + `npx tsc --noEmit`.

**Commit:** **"Derive groups from active events only"**

---

## Task 7 — Lock in group rename/delete behavior for deleted events

**Goal:** `renameGroup`/`deleteGroup` apply to deleted events too (spec: "Group
management and deleted events"). The existing implementation already maps over
*all* events, so this is **characterization testing** — adding tests that pin the
current behavior so a future refactor can't silently break it. No production code
should change; if a test fails, the implementation diverged from the spec and you
investigate.

**Files:** `src/hooks/useCalendarState.test.ts` only.

### Write the tests

```ts
test('renameGroup also renames the group on deleted events', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ name: 'Trashed', type: 'B', month: 1, day: 1, groups: ['Work'] }))
  const id = result.current.events[0].id
  act(() => result.current.deleteEvent(id))

  act(() => result.current.renameGroup('Work', 'Job'))

  const ev = result.current.events.find((e) => e.id === id)!
  expect(ev.groups).toEqual(['Job'])
})

test('deleteGroup also strips the group from deleted events', () => {
  const { result } = renderHook(() => useCalendarState())
  act(() => result.current.addEvent({ name: 'Trashed', type: 'B', month: 1, day: 1, groups: ['Work'] }))
  const id = result.current.events[0].id
  act(() => result.current.deleteEvent(id))

  act(() => result.current.deleteGroup('Work'))

  const ev = result.current.events.find((e) => e.id === id)!
  expect(ev.groups).toEqual([])
})
```

Run them — they should pass against the current code. If they pass, great; the
behavior is now protected.

**Commit:** **"Lock in group rename/delete behavior for deleted events"**

---

## Task 8 — The `DeletedEventList` component

**Goal:** a collapsible section showing all deleted events with a count badge and
per-row Restore button; renders nothing when there are no deleted events (spec:
"Deleted section").

**Files:** `src/components/DeletedEventList.tsx` (new),
`src/components/DeletedEventList.test.tsx` (new).

### Background

This component is **display + restore only** — no editing, no filters (the
Deleted section always shows the full set). It receives the already-sorted
`deletedEvents` and an `onRestore` callback. Model the collapse pattern on
`EventForm.tsx` (`const [expanded, setExpanded] = useState(false)`), and the
row's date/recurrence label on `EventList.tsx` lines ~200–205. Reuse
`formatRecurrenceRule` from `lib/recurrence.ts` — do **not** re-derive recurrence
text.

Each row also renders the event's **groups** (spec: "name, type, date/recurrence,
groups"). This is intentionally slightly more than the active list's read-only
row shows, because the groups tell the user whether a restored event will land on
the calendar (its group must be enabled). Render groups as a comma-joined string,
omitted when the event has none.

### Write the failing tests first

```ts
// ABOUTME: Tests for the DeletedEventList collapsible restore UI.
// ABOUTME: Covers empty state, count badge, expansion, and restore callback.

import { render, screen, fireEvent } from '@testing-library/react'
import { DeletedEventList } from './DeletedEventList'
import type { CalendarEvent } from '../types'

const deleted = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'x', name: 'X', type: 'B', month: 1, day: 1, groups: [], deleted: true, ...over,
})

test('renders nothing when there are no deleted events', () => {
  const { container } = render(<DeletedEventList events={[]} onRestore={() => {}} />)
  expect(container).toBeEmptyDOMElement()
})

test('shows a count badge of deleted events', () => {
  render(<DeletedEventList events={[deleted({ id: '1' }), deleted({ id: '2' })]} onRestore={() => {}} />)
  expect(screen.getByRole('button', { name: /deleted \(2\)/i })).toBeInTheDocument()
})

test('reveals deleted events when expanded', () => {
  render(<DeletedEventList events={[deleted({ id: '1', name: 'Old Coworker' })]} onRestore={() => {}} />)
  // collapsed: the name is not shown yet
  expect(screen.queryByText('Old Coworker')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  expect(screen.getByText('Old Coworker')).toBeInTheDocument()
})

test('calls onRestore with the event id when Restore is clicked', () => {
  const onRestore = vi.fn()
  render(<DeletedEventList events={[deleted({ id: 'abc', name: 'Old Coworker' })]} onRestore={onRestore} />)
  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  fireEvent.click(screen.getByRole('button', { name: /restore/i }))

  expect(onRestore).toHaveBeenCalledWith('abc')
})

test('shows the groups of an expanded deleted event', () => {
  render(<DeletedEventList
    events={[deleted({ id: '1', name: 'Old Coworker', groups: ['Work', 'Bowling'] })]}
    onRestore={() => {}}
  />)
  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))

  expect(screen.getByText('Work, Bowling')).toBeInTheDocument()
})
```

> `vi.fn()` is Vitest's spy. Here it's a *collaborator* we pass in (the parent's
> callback), not the thing under test — so spying on it is correct. We assert the
> component calls our callback with the right id; that's real behavior, not
> mocked behavior.

### Write the component

```tsx
// ABOUTME: Collapsible list of soft-deleted events with per-row restore.
// ABOUTME: Always shows the full deleted set, independent of active-list filters.

import { useState } from 'react'
import type { CalendarEvent } from '../types'
import { formatRecurrenceRule } from '../lib/recurrence'

interface DeletedEventListProps {
  events: CalendarEvent[]
  onRestore: (id: string) => void
}

export function DeletedEventList({ events, onRestore }: DeletedEventListProps) {
  const [expanded, setExpanded] = useState(false)

  if (events.length === 0) return null

  return (
    <div>
      <button onClick={() => setExpanded((v) => !v)}>
        Deleted ({events.length})
      </button>
      {expanded && (
        <div className="event-list-scroll">
          {events.map((event) => (
            <div key={event.id} className="deleted-event">
              <span>{event.name}</span>
              <span>
                {event.type === 'R' && event.recurrence
                  ? ` (R) ${formatRecurrenceRule(event.recurrence)}`
                  : ` (${event.type}) ${event.month}/${event.day}`}
              </span>
              {event.groups.length > 0 && (
                <span className="deleted-event-groups">{event.groups.join(', ')}</span>
              )}
              <button onClick={() => onRestore(event.id)}>Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

Run `npx vitest run src/components/DeletedEventList.test.tsx && npx tsc --noEmit`.

**Commit:** **"Add DeletedEventList component"**

---

## Task 9 — Wire it into the app

**Goal:** point the active-list consumers at `activeEvents`, render
`DeletedEventList`, and leave export/upload counts on the full `events` list
(spec: "Wiring" table).

**Files:** `src/App.tsx`, `src/App.test.tsx`.

### The changes in `App.tsx`

Per the spec's consumer-mapping table:

| Line (approx) | Current | Change to |
|---|---|---|
| `EventList events=` (136) | `state.events` | `state.activeEvents` |
| `Events (n)` heading (134) | `state.events.length` | `state.activeEvents.length` |
| `ExportCsvButton events=` (121) | `state.events` | **unchanged** |
| `CsvUpload eventCount=` (116) | `state.events.length` | **unchanged** |

Then render `DeletedEventList` directly below the `EventList`'s
`panel-section` (still inside the `activeTab === 'events'` block):

```tsx
import { DeletedEventList } from './components/DeletedEventList'
// ...
<section className="panel-section">
  <h2 className="section-label">Events ({state.activeEvents.length})</h2>
  <EventList
    events={state.activeEvents}
    onUpdate={state.updateEvent}
    onDelete={state.deleteEvent}
    availableGroups={state.availableGroups}
  />
  <DeletedEventList
    events={state.deletedEvents}
    onRestore={state.restoreEvent}
  />
</section>
```

### Write the integration test

Add to `src/App.test.tsx`. This exercises the whole stack — add an event, delete
it, confirm it leaves the active list and appears in the Deleted section, then
restore it. Note the existing `EventList` Delete flow has a **confirm step**
(`Delete` → `Confirm`), so the test must click both.

```ts
test('deleting an event moves it to the Deleted section, and restore brings it back', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Events' }))

  // add an event
  fireEvent.click(screen.getByRole('button', { name: /add event/i }))
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Temp Person' } })
  fireEvent.click(screen.getByRole('button', { name: /save event/i }))
  expect(screen.getByText('Temp Person')).toBeInTheDocument()

  // delete it (Delete -> Confirm)
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

  // gone from the active list
  expect(screen.queryByText('Temp Person')).not.toBeInTheDocument()

  // present in the Deleted section once expanded
  fireEvent.click(screen.getByRole('button', { name: /deleted \(1\)/i }))
  expect(screen.getByText('Temp Person')).toBeInTheDocument()

  // restore it
  fireEvent.click(screen.getByRole('button', { name: /restore/i }))
  expect(screen.getByText('Temp Person')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /deleted \(/i })).not.toBeInTheDocument()
})
```

Run the **whole suite** now — wiring changes can ripple:

```bash
npm test
npx tsc --noEmit
```

**Commit:** **"Wire DeletedEventList into the app"**

---

## Task 10 — Styling

**Goal:** the Deleted section reads as "removed" and is visually consistent with
the existing panels. CSS only — no behavior, so no tests (spec: "Reused
styling").

**Files:** `src/App.css`.

Add muted styling for the `deleted-event` rows you introduced. Match the existing
look — open `src/App.css`, find the existing list/row and `.form-error`/muted
styles, and follow their conventions (colors, spacing). A minimal, consistent
treatment:

```css
.deleted-event {
  opacity: 0.65;
}
.deleted-event span:first-child {
  text-decoration: line-through;
}
```

Run `npm run dev`, switch to the **Events** tab, add an event, delete it, expand
**Deleted (1)**, and confirm it looks muted/struck and the Restore button works.
This is a manual visual check — there's no automated assertion for CSS.

**Commit:** **"Style the deleted events list"**

---

## Task 11 — Documentation

**Goal:** users and future maintainers know the feature exists (spec:
"Documentation").

**Files:** `docs/user-manual.md`, `docs/improvements.md`.

1. **`docs/user-manual.md`** — find the section about managing/deleting events and
   add a short paragraph: deleting an event no longer removes it permanently; it
   moves to a **Deleted** section (under the events list on the Events tab) where
   a **Restore** button brings it back. Deleted events are kept in your exported
   CSV (with a `Deleted` column) but never appear on the calendar or PDF until
   restored. Match the manual's existing tone and heading style. This Markdown
   edit is part of the task — do it.

   **`docs/user-manual.pdf` — do NOT touch.** It is a rendered artifact that
   Stephanie regenerates by hand with a separate tool; there is no build step for
   it and you cannot reproduce it. After your `user-manual.md` change is committed,
   **stop and alert Stephanie that the manual changed and the PDF needs a manual
   re-render** (call it out in the task's commit message and in the PR
   description). Leaving the PDF stale until she re-renders is expected and fine.

2. **`docs/improvements.md`** — if there's a matching line, wrap it in
   `~~strikethrough~~` to mark it done (that's the repo convention — see the file
   header). If there's no existing line, add one under an appropriate section
   describing the delivered feature, then strike it.

**Commit:** **"Document soft-delete events feature"** — and in the commit body add
a line: `user-manual.pdf needs a manual re-render (Stephanie).` Then explicitly
tell Stephanie the manual changed.

---

## Task 12 — Final verification

**Goal:** prove the whole feature works end-to-end and nothing regressed.

```bash
npm test            # entire suite green
npx tsc --noEmit    # no type errors
npm run build       # production build succeeds
```

Then a manual smoke test with `npm run dev`:

1. Upload `data/calendar-events.csv` (an existing real file — it has no `Deleted`
   column, which proves backward compatibility: everything should load as
   active).
2. On the **Events** tab, delete a couple of events; confirm they leave the list,
   the `Events (n)` count drops, and `Deleted (n)` appears and increments.
3. Switch to the **Calendar** tab for the relevant month and confirm the deleted
   events are **not** on the calendar; download the PDF and confirm the same.
4. Back on **Events**, expand **Deleted**, click **Restore**, and confirm the
   event returns to the active list and (if its group is enabled) to the
   calendar.
5. Click **Export CSV**, open the downloaded file, and confirm it has the
   `Deleted` column with `true` on the events you left deleted.

If all of that holds, the feature is done.

**Final commit (if anything was touched during verification):** **"Verify
soft-delete feature end-to-end"** — then open a PR against `main`.

---

## Appendix — things that are intentionally NOT in scope (YAGNI)

- **No permanent delete.** Deleted events live forever until restored. Don't add a
  purge button (spec decision Q3).
- **No data migration.** Existing CSVs without a `Deleted` column load fine (every
  row active). Don't rewrite the files in `data/`.
- **No refactor of the CSV dedup into a shared identity helper.** The parser keys
  off raw row strings; the hook keys off `CalendarEvent` objects. They're
  genuinely different; a shared abstraction isn't worth it now.
- **No "show deleted" toggle in the active list.** The Deleted section is separate
  and always shows the full set (spec decisions Q2, Q4).
- **No sorting/filtering controls in the Deleted section.** It ignores the active
  filters by design (spec Q4).
