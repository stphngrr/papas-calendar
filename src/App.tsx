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
import { MONTH_NAMES } from './constants'
import { useState } from 'react'

function App() {
  const state = useCalendarState()
  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar')

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
    `${MONTH_NAMES[state.selectedMonth - 1].toUpperCase()} ${state.selectedYear}`

  return (
    <div className="app">
      <header className="app-header">
        <h1>Papa's Calendar</h1>
      </header>

      <div className="app-layout">
        <aside className="control-panel">
          <div className="tab-bar">
            <button
              className={`tab-button${activeTab === 'calendar' ? ' active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button
              className={`tab-button${activeTab === 'events' ? ' active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>

          {activeTab === 'calendar' && (
            <>
              <section className="panel-section">
                <h2 className="section-label">Calendar</h2>
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
                <div className="button-row">
                  <DownloadPdfButton grid={grid} title={title} />
                </div>
              </section>

              <section className="panel-section">
                <h2 className="section-label">Groups</h2>
                <GroupFilter
                  groups={state.availableGroups}
                  enabledGroups={state.enabledGroups}
                  onToggle={state.toggleGroup}
                  onAddGroup={state.addGroup}
                  onRenameGroup={state.renameGroup}
                  onDeleteGroup={state.deleteGroup}
                />
              </section>

              <section className="panel-section">
                <HolidaySettings
                  enabledHolidays={state.enabledHolidays}
                  customHolidays={state.customHolidays}
                  onToggle={state.toggleHoliday}
                  onAddCustom={state.addCustomHoliday}
                />
              </section>
            </>
          )}

          {activeTab === 'events' && (
            <>
              <section className="panel-section">
                <h2 className="section-label">Import / Export</h2>
                <CsvUpload
                  onLoad={state.loadEventsFromCsv}
                  eventCount={state.events.length}
                  groupNames={state.availableGroups}
                />
                <div className="button-row">
                  <ExportCsvButton events={state.events} />
                </div>
              </section>

              <section className="panel-section">
                <h2 className="section-label">Add Event</h2>
                <EventForm
                  onAdd={state.addEvent}
                  availableGroups={state.availableGroups}
                />
              </section>

              <section className="panel-section">
                <h2 className="section-label">Events ({state.events.length})</h2>
                <EventList
                  events={state.events}
                  onUpdate={state.updateEvent}
                  onDelete={state.deleteEvent}
                  availableGroups={state.availableGroups}
                />
              </section>
            </>
          )}
        </aside>

        <main className="preview-panel">
          <CalendarPreview grid={grid} title={title} />
        </main>
      </div>
    </div>
  )
}

export default App
