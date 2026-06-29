// ABOUTME: Central state management hook for the calendar application.
// ABOUTME: Manages events, group/holiday toggles, month selection, and derived state.

import { useState, useMemo, useCallback } from 'react'
import type { CalendarEvent, Holiday } from '../types'
import { parseEventsFromCsv, compareByDate } from '../lib/csv'
import { HOLIDAY_DEFINITIONS } from '../lib/holidays'
import { serializeRecurrenceRule } from '../lib/recurrence'

// Identity used to detect an active duplicate of a restored event.
// Mirrors the CSV dedup: lower-cased name + date (or serialized recurrence for R).
function eventIdentityKey(e: CalendarEvent): string {
  const datePart =
    e.type === 'R' && e.recurrence
      ? serializeRecurrenceRule(e.recurrence)
      : `${e.month}|${e.day}`
  return `${e.name.toLowerCase()}|${e.type}|${datePart}`
}

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
  const [csvErrors, setCsvErrors] = useState<string[]>([])

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
    return events.filter((e) => {
      if (e.deleted) return false
      if (!e.groups.some((g) => enabledSet.has(g))) return false
      if (e.type === 'R') return true
      return e.month === selectedMonth
    })
  }, [events, selectedMonth, enabledGroups])

  const activeEvents = useMemo(
    () => events.filter((e) => !e.deleted),
    [events],
  )

  const deletedEvents = useMemo(
    () => events.filter((e) => e.deleted).sort(compareByDate),
    [events],
  )

  const loadEventsFromCsv = useCallback((csvString: string) => {
    const { events: parsed, errors } = parseEventsFromCsv(csvString)
    setEvents(parsed)
    setCsvErrors(errors)
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
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, deleted: true } : e)),
    )
  }, [])

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

  const removeCustomHoliday = useCallback((name: string) => {
    setCustomHolidays((prev) => prev.filter((h) => h.name !== name))
  }, [])

  const addGroup = useCallback((group: string) => {
    setCustomGroups((prev) => prev.includes(group) ? prev : [...prev, group])
    setEnabledGroups((prev) => prev.includes(group) ? prev : [...prev, group])
  }, [])

  const renameGroup = useCallback((oldName: string, newName: string) => {
    setEvents((prev) => prev.map((e) => ({
      ...e,
      groups: e.groups.map((g) => g === oldName ? newName : g),
    })))
    setCustomGroups((prev) => prev.map((g) => g === oldName ? newName : g))
    setEnabledGroups((prev) => prev.map((g) => g === oldName ? newName : g))
  }, [])

  const deleteGroup = useCallback((name: string) => {
    setEvents((prev) => prev.map((e) => ({
      ...e,
      groups: e.groups.filter((g) => g !== name),
    })))
    setCustomGroups((prev) => prev.filter((g) => g !== name))
    setEnabledGroups((prev) => prev.filter((g) => g !== name))
  }, [])

  const setCustomTitle = useCallback((title: string) => {
    setCustomTitleState(title)
  }, [])

  return {
    events,
    csvErrors,
    selectedMonth,
    selectedYear,
    enabledGroups,
    enabledHolidays,
    customHolidays,
    customTitle,
    availableGroups,
    filteredEvents,
    activeEvents,
    deletedEvents,
    loadEventsFromCsv,
    addEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
    setMonth,
    setYear,
    addGroup,
    renameGroup,
    deleteGroup,
    toggleGroup,
    toggleHoliday,
    addCustomHoliday,
    removeCustomHoliday,
    setCustomTitle,
  }
}
