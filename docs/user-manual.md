# Papa's Calendar — User Manual

Papa's Calendar is a web app that creates printable monthly calendars filled with birthdays, anniversaries, recurring events, holidays, and moon phases. Everything runs in your web browser — there is no account to create and no data is sent to a server.

**To open the app**, visit:
**https://stphngrr.github.io/papas-calendar/**

---

## Quick Start

1. Open the app in your web browser.
2. Click the **Events** tab on the left.
3. Upload your CSV file (see "Preparing Your CSV File" below) — or add events by hand.
4. Click the **Calendar** tab on the left.
5. Choose a **month** and **year**.
6. Check which **groups** and **holidays** you want to show.
7. Review the preview on the right side of the screen.
8. Click **Download PDF** to save a printable calendar.
9. Print the PDF at actual size, landscape orientation, on letter paper.

---

## The Screen Layout

The screen is divided into two parts:

- **Left side — Control Panel**: Where you manage events, choose the month, toggle groups, and adjust holidays. It has two tabs at the top: **Calendar** and **Events**.
- **Right side — Calendar Preview**: A live preview of your calendar that updates as you make changes.

---

## Calendar Tab

This tab controls what your calendar looks like.

### Month and Year

- **Month**: Choose any month from the dropdown (January through December).
- **Year**: Type or use the arrows to pick a year (valid range: 1900–2099).

The calendar preview on the right updates immediately when you change either one.

### Title

An optional text field where you can give the calendar a custom heading. For example, if you type `Smith Family`, the calendar title will read **SMITH FAMILY — JANUARY 2025** (all text on the calendar appears in capital letters automatically). If you leave it blank, the title is just the month and year.

### Download PDF

Click this button to save your calendar as a PDF file. The PDF is designed for printing on **letter-size paper in landscape orientation** (the wide way). The filename is based on your title — for example, `SMITH FAMILY — JANUARY 2025.pdf`.

### Groups

Groups let you organize events into categories — for example, "Mom's Side", "Dad's Side", and "Friends". Each group has a checkbox next to it:

- **Checked** — Events in that group appear on the calendar.
- **Unchecked** — Events in that group are hidden.

This is useful when you print different versions of the calendar for different people. For example, you might uncheck "Dad's Side" to print a calendar that only shows "Mom's Side" events.

You can also:

- **Add a group**: Click **Add Group**, type the name, and click **Save**.
- **Rename a group**: Click **Edit** next to the group name, type the new name, and click **Save**. This updates the name everywhere.
- **Delete a group**: Click **Delete** next to the group name, then click **Confirm**. The group label is removed from all events (the events themselves are not deleted).

### Holiday Settings

Click **Show Holiday Settings** to expand this section. You'll see a list of holidays with a checkbox next to each one. Check or uncheck holidays to show or hide them on the calendar.

**Built-in holidays include:**

- **January**: New Years Day, Martin Luther King Day
- **February**: Ground Hog Day, Lincoln's Birthday, Presidents' Day, Washington's Birthday
- **March**: St Patrick's Day, Spring Begins
- **April**: All Fools' Day, Earth Day, Professionals Day
- **May**: National Day of Prayer, Mother's Day, Armed Forces Day, Memorial Day
- **June**: Flag Day, Father's Day, Summer Begins
- **July**: Independence Day
- **September**: Labor Day, Grandparents Day, Patriot Day, Autumn Begins
- **October**: Columbus Day, National Boss Day, Halloween
- **November**: All Saints' Day, Election Day, Veterans Day, Thanksgiving Day
- **December**: Pearl Harbor Day, Christmas Day, Winter Begins
- **Varies by year**: Palm Sunday, Good Friday, Easter Sunday, Ash Wednesday, Ascension Day

All built-in holidays are enabled by default.

**Adding a custom holiday:**

At the bottom of the holiday settings, fill in:

1. **Holiday name** — for example, "Grandma's Birthday"
2. **Month** — choose from the dropdown
3. **Day** — type the day number

Then click **Add Holiday**. Your custom holiday will appear on the calendar in that month. To remove it later, click the delete button next to it.

---

## Events Tab

This tab is where you manage your event data — the birthdays, anniversaries, and recurring events that appear on the calendar.

### Import / Export

**Uploading a CSV file:**

Click **Upload CSV** and select your `.csv` file. The app will read the file and load all the events. You'll see a confirmation message like "423 events loaded — Groups: Hooper, Lewis, Westfahl".

If there are problems with the file, you'll see error messages with specific row numbers so you can fix them in your spreadsheet program.

**Exporting your events:**

Click **Export CSV** to download all your current events as a file called `calendar-events.csv`. Use this to save your work — since the app doesn't store anything permanently, exporting is the only way to keep your changes for next time.

### Add Event

Click **Add Event** to expand the form. Fill in the fields and click **Save Event** to add it. Click **Cancel** to close the form without saving.

**For a Birthday or Anniversary:**

1. **Name** — The person's name, or both names for an anniversary (e.g., "John & Jane Smith").
2. **Type** — Choose **Birthday** or **Anniversary**.
3. **Month** — The month of the event.
4. **Day** — The day of the month.
5. **Groups** — Check any groups this event belongs to (optional).

**For a Recurring Event:**

Recurring events repeat on the same day of the week, either every week or once a month. Examples: "Church - 9 AM" every Sunday, or "Book Club" on the 2nd Tuesday of each month.

1. **Name** — The name of the event.
2. **Type** — Choose **Recurring**.
3. **Pattern** — Choose how it repeats:
   - **Every week** — Happens every week on the chosen day (e.g., every Tuesday).
   - **Nth weekday of month** — Happens once a month on a specific occurrence of a day (e.g., the 3rd Monday).
4. **Day of week** — Choose Sunday through Saturday.
5. **Occurrence** (only if you chose "Nth weekday of month") — Choose 1st through 5th. Note: not every month has a 5th occurrence of every day, so a "5th Sunday" event will simply not appear in months that don't have one.
6. **Groups** — Check any groups this event belongs to (optional).

### Events List

Below the form, you'll see a list of all your events. The list shows each event's name, type, and date (or recurrence pattern for recurring events).

**Searching and filtering:**

- **Search box** — Type part of a name to filter the list.
- **Filter by Group** — Show only events belonging to a specific group.
- **Filter by Month** — Show only events in a specific month. Recurring events always appear regardless of which month you filter by.
- **Filter by Type** — Show only birthdays, only anniversaries, or only recurring events.

**Editing an event:**

Click **Edit** on any event to change its name, date, groups, or other details. Click **Save** when done, or **Cancel** to discard changes.

**Deleting an event:**

Click **Delete** on any event, then click **Confirm** to permanently remove it. Click **Cancel** if you change your mind.

---

## Preparing Your CSV File

You can create your event list in any spreadsheet program (Excel, Google Sheets, Numbers, etc.) and save it as a CSV file. The file should have these columns:

| Column | Description | Required? |
|--------|-------------|-----------|
| Name | Person's name or event name | Yes |
| Type | `B` for birthday, `A` for anniversary, `R` for recurring | Yes |
| Month | Month number (1–12) | Yes for B/A, leave blank for R |
| Day | Day of the month (1–31) | Yes for B/A, leave blank for R |
| Groups | Group names, separated by commas | Optional |
| Recurrence | Recurrence pattern (see below) | Required for R, leave blank for B/A |

**Example rows:**

```
Name,Type,Month,Day,Groups,Recurrence
Alice Smith,B,3,15,Family,
Bob & Carol Jones,A,6,20,"Family,Friends",
CHURCH - 9 AM,R,,,Hooper,weekly:Sunday
COMMUNION,R,,,Hooper,nth:1:Sunday
BIBLE STUDY,R,,,Hooper,weekly:Tuesday
```

**Recurrence patterns:**

- `weekly:Sunday` — Every Sunday
- `weekly:Monday` — Every Monday
- `weekly:Tuesday` — Every Tuesday (and so on for any day)
- `nth:1:Sunday` — 1st Sunday of the month
- `nth:2:Monday` — 2nd Monday of the month
- `nth:3:Wednesday` — 3rd Wednesday of the month
- `nth:4:Thursday` — 4th Thursday of the month (like Thanksgiving!)
- `nth:5:Friday` — 5th Friday of the month (skipped in months without one)

**Tips for your CSV file:**

- The first row must be the header row with column names.
- If an event belongs to more than one group, wrap the groups in quotes: `"Family,Friends"`.
- Day names in recurrence patterns are not case-sensitive: `weekly:sunday` works the same as `weekly:Sunday`.
- Don't worry about capitalization in names — the calendar automatically displays everything in capital letters.

---

## The Calendar Preview

The right side of the screen shows a live preview of your calendar. It updates instantly as you change settings. Each day cell shows:

1. The **day number** in bold.
2. **Moon phases** (Full Moon, New Moon, First Qtr, Last Qtr) next to the day number.
3. **Recurring events** (e.g., CHURCH - 9 AM).
4. **Birthdays and anniversaries** with a prefix: B: for birthdays, A: for anniversaries.
5. **Holidays** at the bottom of the cell.

If a birthday or anniversary falls on a day that doesn't exist in the current month (like February 30th), it appears in a separate "overflow" section below the calendar grid.

---

## Printing Tips

- The PDF is designed for **letter-size paper** (8.5" × 11") in **landscape orientation** (the wide way).
- Print at **100% scale** (actual size) for best results.
- The calendar uses black and white only, so it prints well on any printer.

---

## Important: Saving Your Work

Papa's Calendar does not save anything between sessions. When you close or refresh the browser tab, all your events and settings are gone. To keep your work:

1. **Before closing**, switch to the **Events** tab and click **Export CSV**.
2. Save the downloaded file somewhere safe.
3. **Next time you open the app**, upload that same CSV file to pick up where you left off.

Your CSV file is your master data file. Keep it backed up!
