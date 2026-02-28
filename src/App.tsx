// ABOUTME: Root application component for Papa's Calendar.
// ABOUTME: Composes the control panel and calendar preview into the main layout.

import './App.css'
import { useCalendarState } from './hooks/useCalendarState'
import { CsvUpload } from './components/CsvUpload'
import { EventList } from './components/EventList'
import { EventForm } from './components/EventForm'
import { MonthYearSelector } from './components/MonthYearSelector'
import { GroupFilter } from './components/GroupFilter'
import { HolidaySettings } from './components/HolidaySettings'
import { ExportCsvButton } from './components/ExportCsvButton'
import { CustomTitleInput } from './components/CustomTitleInput'
import { CalendarPreview } from './components/CalendarPreview'
import { DownloadPdfButton } from './components/DownloadPdfButton'
import { buildCalendarGrid } from './lib/calendar'
import { getHolidaysForMonth } from './lib/holidays'
import { getMoonPhases } from './lib/moon'

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

function App() {
  const state = useCalendarState()

  const holidays = getHolidaysForMonth(
    state.selectedYear, state.selectedMonth,
    state.enabledHolidays, state.customHolidays,
  )
  const moonPhases = getMoonPhases(state.selectedYear, state.selectedMonth)
  const grid = buildCalendarGrid(
    state.selectedYear, state.selectedMonth,
    state.filteredEvents, holidays, moonPhases,
  )
  const title = state.customTitle ||
    `${MONTH_NAMES[state.selectedMonth - 1]} ${state.selectedYear}`

  return (
    <div>
      <h1>Papa's Calendar</h1>

      <CsvUpload
        onLoad={state.loadEventsFromCsv}
        eventCount={state.events.length}
        groupNames={state.availableGroups}
      />

      <MonthYearSelector
        month={state.selectedMonth}
        year={state.selectedYear}
        onMonthChange={state.setMonth}
        onYearChange={state.setYear}
      />

      <CustomTitleInput
        value={state.customTitle}
        onChange={state.setCustomTitle}
      />

      {state.availableGroups.length > 0 && (
        <GroupFilter
          groups={state.availableGroups}
          enabledGroups={state.enabledGroups}
          onToggle={state.toggleGroup}
        />
      )}

      <HolidaySettings
        enabledHolidays={state.enabledHolidays}
        customHolidays={state.customHolidays}
        onToggle={state.toggleHoliday}
        onAddCustom={state.addCustomHoliday}
      />

      <EventForm
        onAdd={state.addEvent}
        availableGroups={state.availableGroups}
      />

      <EventList
        events={state.events}
        onUpdate={state.updateEvent}
        onDelete={state.deleteEvent}
      />

      <ExportCsvButton events={state.events} />
      <DownloadPdfButton grid={grid} title={title} />

      <CalendarPreview grid={grid} title={title} />
    </div>
  )
}

export default App
