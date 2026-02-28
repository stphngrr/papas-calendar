# Improvements

- ~~Downloaded PDF always has 6 rows even when the month only needs 4 or 5~~
- ~~Collapse Add Event pane when not in use~~
- ~~Don't allow event to be added without a name~~
- ~~Show months as names in dropdowns instead of numbers~~
- ~~Allow event groups to be edited in the UI~~
- ~~Allow a new group to be added in the UI~~
- Verify events in initial-events.csv are correct against example files
- ~~Side pane is busy and events list can get very long — consider moving to another view~~
- ~~Support filtering events list by group, month, and event type (in addition to existing name search)~~

## From code audit

### Bugs
- ~~Events with empty groups are invisible — `filteredEvents` uses `.some()` on groups array, which returns false for empty arrays~~

### Validation
- No error handling on CSV file read failures
- EventList inline edit accepts invalid month/day values
- Year input has no min/max bounds
- No duplicate check when adding custom holidays

### UX
- No way to delete custom holidays once added
- No feedback when CSV uploads with zero valid events
- ~~Page title in index.html is still "papas-calendar-scaffold"~~

### Code quality
- ~~Month name arrays are duplicated in three files — extract to a shared constant~~
- Passover/Hanukkah lookup tables only cover through 2030

### Build
- html2canvas (201 KB) ships as unused transitive dependency
- dist/ may not be in .gitignore
