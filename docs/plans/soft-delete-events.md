# Soft-Delete Events — Design Spec

## Overview

Today, deleting an event removes it permanently: `deleteEvent` filters it out of
state (`useCalendarState.ts`) and it never appears in the next CSV export. There
is no way to recover it.

This feature changes deletion to a recoverable, soft delete. A deleted event is
kept in memory and persisted in the CSV, but is excluded from every calendar
output (HTML preview and generated PDF) until restored. Deleted events are
surfaced in a dedicated **Deleted** section of the UI, each with a **Restore**
button. There is no permanent delete — once you ask Papa's Calendar to remember
something, it stays recoverable.

## Data Model

`CalendarEvent` gains one optional field in `src/types.ts`:

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

A single `events` array continues to hold everything. "Deleted" is a flag on the
event, not a separate collection. This keeps each event's `id` stable, which is
what makes restore a lossless undo: flipping the flag back returns the event to
the active list with its name, date, and recurrence intact. Its groups are
preserved too, but evaluated against the *current* group vocabulary — group
renames and deletions that happened while the event was in the trash apply to it
as well (see "Group management and deleted events").

## CSV Format

The CSV gains an optional 7th column, `Deleted`:

```
Name,Type,Month,Day,Groups,Recurrence,Deleted
```

- Active events write an empty `Deleted` value.
- Deleted events write `true`.

The column is last, so existing CSVs that lack it parse unchanged.

### Parsing the `Deleted` value

The value is trimmed and case-folded, then interpreted strictly:

| Value (after trim, case-insensitive) | Meaning |
|---|---|
| `true` | deleted |
| blank, absent, or `false` | active |
| any other nonblank value (`yes`, `1`, `x`, …) | **parse error** |

A parse error here behaves like every other invalid field in the parser
(`Type`, `Month`, `Day`): it pushes an error and **skips the whole row** via
`continue`, even though the row's name/type/date may be valid. This is
deliberate — it's consistent with the parser's uniform error-and-skip pattern,
and surfacing `Row N: invalid Deleted value "x"` is better than silently guessing
whether the event is active or deleted. Accepting `false` explicitly as active
(rather than treating it as garbage) matters, since that's the natural value a
person or spreadsheet writes for an active row.

The error message format is: `Row {n}: invalid Deleted value "{raw}"`.

Deleted events are **not** segregated in the file. They sort by date alongside
active events via the existing `compareByDate`; the `Deleted` column is the only
thing distinguishing them.

### Example CSV rows

```csv
Amy Holland,B,2,4,Lewis,,
Sam & Kassie Jones,A,2,19,"Lewis,Hooper",,
Old Coworker,B,5,9,Work,,true
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday,
```

## Deduplication on Import

The parser's dedup key gains the deleted flag: `name|type|month|day|deleted`
(and the recurrence-keyed variant for `R` events similarly includes the flag).

- A deleted row and an otherwise-identical active row are treated as **distinct**
  events — both survive a round-trip. (You could legitimately have deleted
  "John, B, 3/15" and later added a fresh active "John, B, 3/15"; the file should
  preserve exactly that.)
- Two deleted rows that match each other still dedup and merge their groups,
  exactly as two active rows do today.

This rule governs what survives **parsing**. Restoring a deleted event later
could otherwise reintroduce a duplicate of its active twin — `restoreEvent`
merges in that case so the in-app model stays consistent with the active-dedup
rule (see "Restore and calendar visibility"). The net effect is that, however a
deleted/active pair entered the app, the dataset converges on a single active
event with the union of their groups once the deleted one is restored.

## State & Filtering

In `useCalendarState.ts`:

- **`deleteEvent(id)`** no longer removes the event. It sets `deleted: true` on
  the matching event. Nothing else about the event changes.
- **`restoreEvent(id)`** (new) returns an event to active status. If no active
  event shares its identity it simply sets `deleted: false`. If an **identical
  active event already exists** it instead merges the restored event's groups into
  that existing active event (union, preserving order) and drops the now-redundant
  deleted record. Either way it does **not** touch `enabledGroups`.

  Identity is compared via a normalized key, mirroring the import dedup
  (`csv.ts`): the name is lower-cased, and the date component is
  `month|day` for `B`/`A` events or the **serialized recurrence rule** for `R`
  events. The serializer is the existing `serializeRecurrenceRule`
  (`recurrence.ts`) — equal `RecurrenceRule` objects serialize to identical
  strings (`weekly:Sunday`, `nth:1:Sunday`), so the comparison is normalized by
  construction rather than comparing the in-memory object or raw, case-varying CSV
  text. The keys are therefore:
  - `B`/`A`: `${name.toLowerCase()}|${type}|${month}|${day}`
  - `R`: `${name.toLowerCase()}|${type}|${serializeRecurrenceRule(recurrence)}`
  A restored event returns to the active list immediately; whether it appears on
  the calendar follows the same group filter that governs every other active
  event (see below).
- **`filteredEvents`** — the list feeding `buildCalendarGrid()`, the preview, and
  the PDF — gains a guard that skips any event with `deleted === true`. Deleted
  events therefore never reach any calendar output.
- **`activeEvents`** (derived) — non-deleted events; what the active list and its
  group/month/type/name filters operate on.
- **`deletedEvents`** (derived) — every event with `deleted === true`, returned
  **unfiltered**, so the Deleted section always shows the complete recoverable
  set regardless of the active filters.
- **`availableGroups`** and the group filter are derived from active events only,
  so a group existing solely on a deleted event won't clutter the calendar's
  group filter. The group string is still stored on the deleted event, so once
  the event is restored its group reappears in `availableGroups`.
- **`loadEventsFromCsv`** seeds `enabledGroups` from **active events only** — the
  same active-only set that feeds `availableGroups`. This is a required change to
  the current code, which seeds from every parsed event (`useCalendarState.ts:49`).
  Without it, a group present solely on deleted rows in the imported CSV would be
  enabled but absent from `availableGroups` — enabled *invisibly*, with no
  checkbox in the GroupFilter — and restoring such an event would put it on the
  calendar immediately, contradicting the "reappears unchecked" behavior below.

### Restore and calendar visibility

When no identical active event exists, `restoreEvent` flips the `deleted` flag
and nothing more (the merge case is covered above); either way it does not modify
`enabledGroups`. Calendar visibility of a restored event therefore follows the
existing group filter (`filteredEvents` shows an event only if at least one of
its groups is in `enabledGroups`):

- In the common case the event's group is already enabled (after a CSV load,
  `enabledGroups` is seeded with every active group present), so restore returns
  the event to both the active list and the calendar.
- If the user had manually disabled the event's group, the restored event
  returns to the active list but stays off the calendar until that group is
  re-enabled — consistent with how the group filter treats every other event.
- If the group existed only on deleted events, it reappears in `availableGroups`
  (and thus the GroupFilter) after restore, unchecked; the user enables it to put
  the event on the calendar.

This is a deliberate choice: "lossless restore" applies to the event's *data*
(groups, date, recurrence are preserved on the event), not to overriding the
group filter, which is an orthogonal, user-controlled view setting. Restore never
silently re-enables a group the user turned off, which would drag unrelated
events of that group back onto the calendar.

### Group management and deleted events

`renameGroup` and `deleteGroup` map over the entire `events` array, so they apply
to deleted events as well as active ones. This is intentional, not incidental:

- **Rename** propagates to deleted events, so a restored event uses the current
  group name rather than resurrecting the old one in `availableGroups`.
- **Delete** strips the group from deleted events too, so restoring an event can
  never bring back a group the user explicitly removed. An event whose only group
  was deleted comes back groupless — the same outcome the existing code already
  produces for active events.

Group rename/delete are deliberate, global vocabulary edits; applying them
uniformly (trash included) keeps the dataset consistent and avoids "zombie
groups" re-entering through restore. The existing `map`-over-all implementation
already does this; the spec records it as the desired behavior and the tests lock
it in.

Export writes the full `events` array (active + deleted) so nothing is lost on a
round-trip.

## UI

### Active list

`EventList` is unchanged in spirit. Its per-row **Delete** button now triggers
the soft delete (flag flip) instead of a hard removal. From the user's view the
event still leaves the active list — it now lands in the Deleted section instead
of disappearing forever.

### Deleted section

A new `DeletedEventList` component, rendered as a collapsible section below the
active list (matching the collapse pattern used for the Add Event pane):

- Collapsed: a header with a count, e.g. **Deleted (3)**, so its presence is
  visible without taking space.
- Expanded: every deleted event in date order, each row showing the same
  identifying info as the active list (name, type, date/recurrence, groups),
  rendered in a muted/struck style to read as "removed," with a **Restore**
  button per row.
- No Delete button and no permanent delete.
- When there are zero deleted events, the section hides entirely to keep the UI
  clean.
- The section deliberately ignores the group/month/type/name filter controls; it
  always shows the full recoverable set.

### Wiring

`App.tsx` today passes `state.events` directly to four consumers. With the
active/deleted split, each must be pointed at the correct list so counts and
editability stay coherent:

| Consumer | Today | Becomes | Why |
|---|---|---|---|
| `EventList events=` (`App.tsx:136`) | `state.events` | **`activeEvents`** | Deleted rows must not be editable in the active list |
| `Events (n)` section heading (`App.tsx:134`) | `state.events.length` | **`activeEvents.length`** | The count must match the list it labels |
| `DeletedEventList` + its `Deleted (n)` badge (new) | — | **`deletedEvents`** / `deletedEvents.length` | The recoverable set |
| `ExportCsvButton events=` (`App.tsx:121`) | `state.events` | **`state.events`** (unchanged) | Export must persist active **and** deleted rows |
| `CsvUpload eventCount=` (`App.tsx:116`) | `state.events.length` | **`state.events.length`** (unchanged) | "N events loaded" reports everything parsed from the file, deleted included; the `Deleted (n)` badge makes the active-vs-deleted breakdown discoverable |

Tying the active-list heading count to the same list the component renders is what
prevents the "Events (412) but only 407 shown" mismatch.

`App.tsx` also passes `restoreEvent` to `DeletedEventList` alongside `deletedEvents`.

Styling reuses existing CSS conventions (collapsible pane, list-row, muted-text)
rather than inventing new visual language.

## Edge Cases

- A deleted recurring (`R`) event round-trips with blank `Month`/`Day` plus
  `Deleted=true`.
- Deleting an event added in-session (never loaded from a CSV) still persists it
  through the next export.
- The Deleted count badge updates live as events are deleted and restored.
- Restoring a deleted event that has an identical active twin merges their groups
  into the active event rather than producing two identical active rows; no
  duplicate appears on the calendar and the CSV round-trip is stable.
- Restoring an event whose group is currently disabled (or existed only on
  deleted events) returns it to the active list, but it stays off the calendar
  until the user enables that group. Restore does not auto-enable groups (see
  "Restore and calendar visibility").

## Non-Goals

- No permanent / hard delete.
- No separate "trash retention" period or auto-purge.
- No change to how active events render in the calendar or PDF.

## Documentation

On implementation, the user manual gains a note about the Deleted section and
restore, and `docs/improvements.md` records the feature.
