# Recurring Events — Design Spec

## Overview

Papa's Calendar currently supports two event types: birthdays (B) and anniversaries (A), both tied to a fixed month and day. This feature adds a third type — recurring events (R) — for events that repeat on a weekly or monthly pattern, such as church services and Bible study.

Recurring events render identically to other events in calendar day cells (plain text, no type prefix). The difference is how they land on dates: instead of a fixed month+day, they follow a recurrence rule evaluated against each month/year.

## CSV Format

The CSV gains an optional 6th column, `Recurrence`:

```
Name,Type,Month,Day,Groups,Recurrence
```

For B and A events, `Recurrence` is empty or omitted. Existing 5-column CSVs continue to work unchanged — full backward compatibility.

For R events, `Month` and `Day` are ignored (written as empty in the CSV). The `Recurrence` column defines the pattern.

### Recurrence patterns

Two patterns are supported initially. The string format uses a prefix to identify the pattern, making future patterns easy to add.

| Pattern | Format | Example | Meaning |
|---------|--------|---------|---------|
| Weekly | `weekly:<DayName>` | `weekly:Sunday` | Every Sunday |
| Nth weekday | `nth:<N>:<DayName>` | `nth:1:Sunday` | 1st Sunday of each month |

Day names are case-insensitive: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday. N ranges from 1–5.

### Example CSV rows

```csv
Amy Holland,B,2,4,Lewis,
Sam & Kassie Jones,A,2,19,"Lewis,Hooper",
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
SUNDAY SCHOOL 10:15 AM,R,,,Hooper,weekly:Sunday
7:00 PM - CHURCH ADULT BIBLE STUDY,R,,,Hooper,weekly:Tuesday
COMMUNION,R,,,Hooper,nth:1:Sunday
```

## Data Model

### Type changes (`types.ts`)

`CalendarEvent.type` widens from `'B' | 'A'` to `'B' | 'A' | 'R'`.

`CalendarEvent` gains an optional field:

```ts
recurrence?: RecurrenceRule
```

`RecurrenceRule` is a new discriminated union:

```ts
type RecurrenceRule =
  | { kind: 'weekly'; dayOfWeek: number }        // 0=Sunday .. 6=Saturday
  | { kind: 'nth'; n: number; dayOfWeek: number } // nth weekday of month
```

For R events, `month` is 0 and `day` is 0 by convention. These fields are unused — placement is driven entirely by the recurrence rule.

## Recurrence Expansion (`src/lib/recurrence.ts`)

A new pure-function module handles expanding recurring events into concrete dates for a given month/year.

### Public API

```ts
expandRecurringEvents(
  events: CalendarEvent[],
  year: number,
  month: number
): ExpandedRecurringEvent[]
```

`ExpandedRecurringEvent` is:

```ts
{ name: string; day: number }
```

The function:
1. Filters input to R-type events only
2. For each, evaluates the recurrence rule against every day in the target month
3. Returns a flat list of name+day pairs

### Expansion logic

- **weekly**: iterate days 1–N of the month, include each day whose day-of-week matches
- **nth**: iterate days of the month, count occurrences of the target weekday, include the Nth one. If the month doesn't have N occurrences (e.g., 5th Friday), produce nothing for that event.

### Validation

A helper function validates recurrence rule strings during CSV parsing:

```ts
parseRecurrenceRule(raw: string): RecurrenceRule | null
```

Returns `null` for invalid strings. The CSV parser reports these as errors.

Valid: known prefix, valid day name, n in 1–5. Invalid: unknown prefix, misspelled day, n=0 or n>5, empty string.

## Integration Points

### CSV parsing (`csv.ts`)

- Detects the 6th column by header presence
- For R-type rows: parses `Recurrence` column via `parseRecurrenceRule`, ignores `Month`/`Day`
- For B/A rows: `Recurrence` column is ignored if present
- Validation: R events require a valid recurrence string; B/A events require valid month+day (unchanged)
- Export: writes 6-column format, `Recurrence` is empty for B/A events

**Backward compatibility**: if the header row has only 5 columns, parsing works exactly as today. The 6th column is only expected when present in the header.

### Calendar grid (`calendar.ts`)

`buildCalendarGrid` currently receives events, holidays, and moon phases. Expanded recurring events are passed in as a new parameter or merged into the event stream before the call.

Recurring events render as plain text in day cells — no "B:" or "A:" prefix. The event name is the complete display string (including any time, e.g., "CHURCH - 9 AM").

### Group filtering (`useCalendarState.ts`)

Recurring events have groups and are filtered the same way as B/A events — an R event appears only when at least one of its groups is enabled.

**Month filtering exception**: when building `filteredEvents` for the event list UI, R events are included regardless of the selected month, since they apply to all months.

### PDF and HTML preview

No changes. Both render whatever text appears in day cells. Recurring events are just more text entries — they're indistinguishable from other content at the rendering layer.

## UI Changes

### Event form (`EventForm`)

The type dropdown gains a third option: "Recurring" (R).

When R is selected, the month and day fields are replaced with:
- **Pattern**: dropdown — "Every week" / "Nth weekday of month"
- **Day of week**: dropdown — Sunday through Saturday
- **Which occurrence** (nth only): dropdown — 1st through 5th

Name field and group checkboxes remain unchanged.

### Event list (`EventList`)

- R events display a human-readable recurrence description instead of a date (e.g., "Every Sunday", "1st Sunday of month")
- The type filter dropdown gains an "R" / "Recurring" option
- The month filter does not hide R events — they always appear
- Inline editing of R events allows changing name, groups, and recurrence fields (not month/day)

### No changes needed

MonthYearSelector, GroupFilter, HolidaySettings, CalendarPreview, DownloadPdfButton, CsvUpload (file handling), ExportCsvButton — all agnostic to event types.

## Testing

### `recurrence.test.ts`
- Weekly expansion: correct days for each weekday, various month shapes
- Nth-weekday expansion: 1st through 5th, months with/without a 5th occurrence
- `parseRecurrenceRule`: valid patterns parse correctly, invalid patterns return null
- Edge cases: February in leap/non-leap years

### `csv.test.ts` (additions)
- Parse 6-column CSV with R events
- Backward compatibility: 5-column CSV still works
- Round-trip: R events survive parse → export → parse
- Error reporting for malformed recurrence strings
- Mixed B/A/R events in one file

### `calendar.test.ts` (additions)
- Expanded recurring events placed on correct days
- Recurring events interleave with B/A events and holidays in same cell
- Recurring events render without type prefix

### `useCalendarState.test.ts` (additions)
- R events pass group filtering
- R events included regardless of selected month
- CRUD operations on R events

### Component tests (additions)
- EventForm: type R shows recurrence fields, hides month/day, validates recurrence input
- EventList: R events display recurrence description, month filter doesn't hide them

### Validation against example PDF
- Load church events, expand for January 2025, verify days match `examples/JANUARY 2025 - C.pdf`
