# Papa's Calendar — Design Specification

## Overview

Papa's Calendar is a client-side React web app that generates printable monthly
calendars populated with birthdays, anniversaries, holidays, and moon phases. It
replaces a manual Excel-based workflow where calendars are hand-built each month.

The app is fully stateless — no data is stored on any server. All personal data
lives in the user's CSV file and in the browser session. It is built with React +
Vite + TypeScript and hosted on GitHub Pages.

### Core Workflow

1. Upload a master CSV of birthdays and anniversaries
2. Optionally add or edit events manually in the UI
3. Select a month and year
4. Check which calendar groups to include
5. Toggle holidays on/off, optionally add custom one-off holidays
6. Verify the live preview
7. Download as a landscape PDF
8. Export the updated event list as a new master CSV if changes were made

The app produces calendars for three groups: the Westfahl family, the Hooper
Church, and the Lewis family. The Lewis family calendar includes all events from
the other two groups plus Lewis-specific events.

---

## Data Model

### Events

Each event in the system has:

| Field  | Type       | Description                                          |
|--------|------------|------------------------------------------------------|
| Name   | string     | Display name (e.g., "AMY HOLLAND", "SAM & KASSIE JONES") |
| Type   | `B` or `A` | Birthday or Anniversary                              |
| Month  | 1–12       | Month of the event                                   |
| Day    | 1–31       | Day of the event                                     |
| Groups | string[]   | One or more group tags (e.g., `["Lewis", "Hooper"]`) |

### CSV Format

```csv
Name,Type,Month,Day,Groups
Amy Holland,B,2,4,Lewis
Sam & Kassie Jones,A,2,19,"Lewis,Hooper"
Tootsie Powszukiewicz,B,2,16,Lewis
```

- **Groups** are comma-separated within quotes when there are multiple.
- The CSV represents a full-year master list (all months, all groups).
- Uploading a new CSV replaces the previous one entirely.

### Calendar Groups

Groups are discovered dynamically from the loaded event data. The app scans all
events, collects unique group names, and presents them as filter checkboxes. No
groups are predefined — if a new group name appears in the CSV, it shows up
automatically.

A person can belong to multiple groups. An event appears on the generated
calendar if at least one of its groups is checked in the filter.

### Holidays

Holidays are auto-generated from a built-in curated list derived from the 2025
example calendars. Each holiday is classified as:

- **Fixed-date**: Always the same date (e.g., Christmas is Dec 25)
- **Floating**: Computed by rule (e.g., Presidents' Day is the third Monday in
  February)

The holiday list is configurable in the UI:
- Each holiday has a checkbox to include/exclude it
- All holidays default to "on"
- A text input + date picker allows adding **custom one-off holidays** for the
  current session (not persisted)

Holidays render in calendar cells as plain uppercase text without a prefix (e.g.,
"GROUND HOG DAY", "PRESIDENTS' DAY").

### Moon Phases

The four major moon phases (Full Moon, New Moon, First Quarter, Last Quarter) are
auto-generated using an astronomical calculation library for any given month/year.
They are always included (no toggle) and display as small text next to the day
number in the cell.

---

## Calendar Layout

The generated calendar matches the format of the existing hand-made Excel
calendars:

### Grid Structure
- **Landscape orientation** (11" × 8.5" letter size)
- **7-column grid**: Sunday through Saturday
- **Header row**: Day names in small text
- **5 or 6 body rows** depending on the month

### Cell Contents (top to bottom)
1. **Day number** — large, bold, top-left
2. **Moon phase** — small text next to day number (e.g., "FULL MOON")
3. **Personal events** — prefixed with "B:" or "A:", name in all caps
4. **Holidays** — plain uppercase text, no prefix, at the bottom

### Title Placement
- **5-row months**: Title displays in the empty 6th row area, centered
- **6-row months**: Title displays below the grid

The title defaults to "MONTH YEAR" (e.g., "FEBRUARY 2026") but can be overridden
with a custom title via a text field (e.g., "HOLLAND FAMILY — FEBRUARY 2026").

### Overflow Area
Events on dates that don't exist in the selected month (e.g., a Feb 29
anniversary in a non-leap year) display in empty cells of the last row with the
actual date noted alongside the event (e.g., "A: MATT & ELIZABETH KERN FEB 29").

### Visual Style
- Black cell borders, clean grid lines
- Consistent font sizing that scales down when a cell has many events
- All text is uppercase
- Matches the look of the Excel-exported examples as closely as possible

---

## User Interface

The UI is a single page split into two areas:

### Control Panel (left side)

1. **CSV Upload**
   - File picker to load the master CSV
   - Uploading a new file replaces the previous one
   - Shows a count of loaded events and discovered group names

2. **Event List & Editor**
   - Scrollable list of all current events (from CSV + manual entry)
   - Each event can be edited inline (name, type, date, group memberships)
   - Each event can be deleted
   - Full CRUD: add, view, edit, delete

3. **Manual Event Entry**
   - Form: name, type (B/A dropdown), month, day, group checkboxes
   - "Add" button appends to the in-memory list

4. **Export CSV**
   - Button to download the entire current event list as a CSV
   - Captures all edits and manual additions since the last upload

5. **Month/Year Selector**
   - Dropdowns for month (January–December) and year

6. **Group Filter**
   - Checkboxes for each discovered group
   - Only events with at least one checked group appear on the calendar

7. **Holiday Settings**
   - Collapsible section with checkboxes for each built-in holiday
   - Text input + date picker to add custom one-off holidays
   - Custom holidays appear in the checkbox list for the current session

8. **Custom Title**
   - Optional text field; blank defaults to "MONTH YEAR"

9. **Download PDF**
   - Prominent button that exports the current preview as a landscape PDF

### Calendar Preview (right side)

- Live-updating render of the calendar grid
- Reflects all current settings (month, year, groups, holidays, title) in
  real time
- Serves as a visual approximation; the PDF output is the authoritative
  format

---

## Technical Stack

| Concern          | Choice                        | Rationale                                    |
|------------------|-------------------------------|----------------------------------------------|
| Framework        | React + TypeScript            | Natural fit for form-heavy interactive state  |
| Build tool       | Vite                          | Fast dev server, builds to static files       |
| CSV parsing      | PapaParse                     | Robust, handles quoted fields, zero deps      |
| Moon phases      | lune or suncalc               | Small library for astronomical calculations   |
| PDF generation   | jsPDF (direct drawing)        | Crisp vector output, full layout control      |
| Hosting          | GitHub Pages                  | Free, auto-deploys from repo, no server       |
| Deployment       | GitHub Action                 | Runs `npm run build`, deploys `dist/`         |

### PDF Strategy

The PDF is generated using jsPDF with direct drawing (programmatic lines, text,
and rectangles) rather than html2canvas screenshotting. This produces crisp vector
text and precise layout matching the Excel-exported originals. The PDF rendering
logic is separate from the HTML preview — the preview is a close visual
approximation, but the PDF is the authoritative output.

---

## Data Extraction from Examples

Before development, we perform a one-time data extraction from all 12 months of
2025 example calendars plus February 2026:

### Output 1: Initial Master CSV
- Extract every birthday and anniversary from all 13 calendars
- Deduplicate by name + date
- Pre-tag all events with the "Lewis" group (since the examples are Lewis
  family calendars that include everything)
- Group assignments for Westfahl and Hooper will be added later by the user
  via the event editor UI

### Output 2: Holiday List
- Collect every holiday across all 13 calendars
- Classify each as fixed-date or floating
- Implement date computation rules for floating holidays
- This becomes the built-in curated holiday set

---

## Edge Cases

- **Feb 29 in non-leap years**: Event displays in overflow area with date noted
- **Many events on one day**: Font scales down to fit; layout gracefully handles
  crowded cells
- **No events loaded**: Calendar renders with just holidays and moon phases
- **No groups checked**: Calendar renders empty (holidays and moon phases only)
- **CSV with no Groups column or blank groups**: Events get no group assignment;
  user must edit groups in the UI
- **Duplicate events**: Same name + type + date uploaded twice are deduplicated
- **Custom holidays**: Persist only for the current browser session
