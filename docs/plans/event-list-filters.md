# Event List Filters: Group, Month, and Event Type

## Context

The EventList component currently only supports searching by name. The improvements list calls for filtering by group, month, and event type (B/A). This makes it easier to find and manage events in a large list (412+ events).

## Files to Modify

- `src/components/EventList.tsx` — add filter state and UI
- `src/components/EventList.test.tsx` — add tests for each filter

## Design

Add three `<select>` dropdowns above the event list, alongside the existing search input:

1. **Group** — default "All Groups", options: each available group name
2. **Month** — default "All Months", options: Jan–Dec (uses existing `MONTH_NAMES` constant)
3. **Type** — default "All Types", options: Birthday, Anniversary

All filters chain with the existing name search using AND logic. All state is local to EventList — no changes to useCalendarState or App.tsx.

### Filter state (new):
```ts
const [filterGroup, setFilterGroup] = useState('')   // '' = all
const [filterMonth, setFilterMonth] = useState(0)    // 0 = all
const [filterType, setFilterType] = useState('')     // '' = all
```

### Filter logic (replaces lines 39-41):
```ts
const filtered = events.filter((e) => {
  if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
  if (filterGroup && !e.groups.includes(filterGroup)) return false
  if (filterMonth && e.month !== filterMonth) return false
  if (filterType && e.type !== filterType) return false
  return true
})
```

## TDD Order

1. Test: group filter filters by group → fail → implement → pass
2. Test: month filter filters by month → fail → implement → pass
3. Test: type filter filters by type → fail → implement → pass
4. Test: filters combine with name search → fail → implement → pass
5. Full suite + type-check

## Verification

1. `npm test` — all pass
2. `npx tsc --noEmit` — clean
3. `npm run dev` — verify filters in browser
