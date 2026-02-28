// ABOUTME: Central state management hook for the calendar application.
// ABOUTME: Manages events, group/holiday toggles, month selection, and derived state.

import { useState, useMemo, useCallback } from 'react'
import type { CalendarEvent, Holiday } from '../types'
import { parseEventsFromCsv } from '../lib/csv'
import { HOLIDAY_DEFINITIONS } from '../lib/holidays'

export function useCalendarState() {
  const now = new Date()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [enabledGroups, setEnabledGroups] = useState<string[]>([])
  const [enabledHolidays, setEnabledHolidays] = useState<string[]>(
    () => HOLIDAY_DEFINITIONS.map((d) => d.name),
  )
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([])
  const [customTitle, setCustomTitleState] = useState('')
  const [customGroups, setCustomGroups] = useState<string[]>([])

  const availableGroups = useMemo(() => {
    const groups = new Set<string>()
    for (const e of events) {
      for (const g of e.groups) {
        groups.add(g)
      }
    }
    for (const g of customGroups) {
      groups.add(g)
    }
    return Array.from(groups).sort()
  }, [events, customGroups])

  const filteredEvents = useMemo(() => {
    const enabledSet = new Set(enabledGroups)
    return events.filter(
      (e) =>
        e.month === selectedMonth &&
        (e.groups.length === 0 || e.groups.some((g) => enabledSet.has(g))),
    )
  }, [events, selectedMonth, enabledGroups])

  const loadEventsFromCsv = useCallback((csvString: string) => {
    const parsed = parseEventsFromCsv(csvString)
    setEvents(parsed)
    const groups = new Set<string>()
    for (const e of parsed) {
      for (const g of e.groups) {
        groups.add(g)
      }
    }
    setEnabledGroups(Array.from(groups).sort())
  }, [])

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    setEvents((prev) => [...prev, { ...event, id: crypto.randomUUID() }])
  }, [])

  const updateEvent = useCallback(
    (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      )
    },
    [],
  )

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const setMonth = useCallback((month: number) => {
    setSelectedMonth(month)
  }, [])

  const setYear = useCallback((year: number) => {
    setSelectedYear(year)
  }, [])

  const toggleGroup = useCallback((group: string) => {
    setEnabledGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group],
    )
  }, [])

  const toggleHoliday = useCallback((name: string) => {
    setEnabledHolidays((prev) =>
      prev.includes(name)
        ? prev.filter((h) => h !== name)
        : [...prev, name],
    )
  }, [])

  const addCustomHoliday = useCallback((holiday: Holiday) => {
    setCustomHolidays((prev) => [...prev, holiday])
  }, [])

  const addGroup = useCallback((group: string) => {
    setCustomGroups((prev) => prev.includes(group) ? prev : [...prev, group])
    setEnabledGroups((prev) => prev.includes(group) ? prev : [...prev, group])
  }, [])

  const setCustomTitle = useCallback((title: string) => {
    setCustomTitleState(title)
  }, [])

  return {
    events,
    selectedMonth,
    selectedYear,
    enabledGroups,
    enabledHolidays,
    customHolidays,
    customTitle,
    availableGroups,
    filteredEvents,
    loadEventsFromCsv,
    addEvent,
    updateEvent,
    deleteEvent,
    setMonth,
    setYear,
    addGroup,
    toggleGroup,
    toggleHoliday,
    addCustomHoliday,
    setCustomTitle,
  }
}
