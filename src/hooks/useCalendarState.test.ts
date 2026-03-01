// ABOUTME: Tests for the useCalendarState hook that manages all app state.
// ABOUTME: Covers event CRUD, group/holiday toggles, filtering, and derived state.

import { renderHook, act } from '@testing-library/react'
import { useCalendarState } from './useCalendarState'

const CSV_TWO_GROUPS = `Name,Type,Month,Day,Groups
Alice,B,3,15,Family
Bob,A,3,20,Friends
Carol,B,6,10,"Family,Friends"`

describe('useCalendarState', () => {
  test('initial state has current month/year and empty events', () => {
    const { result } = renderHook(() => useCalendarState())
    const now = new Date()
    expect(result.current.selectedMonth).toBe(now.getMonth() + 1)
    expect(result.current.selectedYear).toBe(now.getFullYear())
    expect(result.current.events).toEqual([])
    expect(result.current.enabledGroups).toEqual([])
    expect(result.current.enabledHolidays.length).toBeGreaterThan(0)
    expect(result.current.customHolidays).toEqual([])
    expect(result.current.customTitle).toBe('')
  })

  test('loadEventsFromCsv replaces events and auto-enables all discovered groups', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    expect(result.current.events).toHaveLength(3)
    expect(result.current.enabledGroups).toContain('Family')
    expect(result.current.enabledGroups).toContain('Friends')
  })

  test('loadEventsFromCsv exposes csvErrors from parsing', () => {
    const { result } = renderHook(() => useCalendarState())
    const csv = `Name,Type,Month,Day,Groups
,B,2,4,Lewis
Valid Person,B,6,15,Family`
    act(() => result.current.loadEventsFromCsv(csv))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.csvErrors).toEqual(['Row 2: missing name'])
  })

  test('csvErrors clears on successful load', () => {
    const { result } = renderHook(() => useCalendarState())
    // First load with errors
    act(() => result.current.loadEventsFromCsv(`Name,Type,Month,Day,Groups
,B,2,4,Lewis`))
    expect(result.current.csvErrors).toHaveLength(1)
    // Second load with no errors
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    expect(result.current.csvErrors).toEqual([])
  })

  test('csvErrors is empty initially', () => {
    const { result } = renderHook(() => useCalendarState())
    expect(result.current.csvErrors).toEqual([])
  })

  test('addEvent adds an event with a generated id', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'Dan', type: 'B', month: 1, day: 5, groups: ['Work'],
    }))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0].name).toBe('Dan')
    expect(result.current.events[0].id).toBeTruthy()
  })

  test('updateEvent modifies an event\'s fields', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'Eve', type: 'B', month: 2, day: 14, groups: [],
    }))
    const id = result.current.events[0].id
    act(() => result.current.updateEvent(id, { name: 'Eva' }))
    expect(result.current.events[0].name).toBe('Eva')
    expect(result.current.events[0].month).toBe(2) // unchanged
  })

  test('deleteEvent removes an event', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'Frank', type: 'A', month: 7, day: 4, groups: [],
    }))
    const id = result.current.events[0].id
    act(() => result.current.deleteEvent(id))
    expect(result.current.events).toHaveLength(0)
  })

  test('toggleGroup adds/removes groups from enabledGroups', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    expect(result.current.enabledGroups).toContain('Family')
    act(() => result.current.toggleGroup('Family'))
    expect(result.current.enabledGroups).not.toContain('Family')
    act(() => result.current.toggleGroup('Family'))
    expect(result.current.enabledGroups).toContain('Family')
  })

  test('filteredEvents returns only events matching enabled groups and month', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    // Set to March to see Alice (Family) and Bob (Friends)
    act(() => result.current.setMonth(3))
    expect(result.current.filteredEvents).toHaveLength(2)
    // Disable Friends — Bob should disappear
    act(() => result.current.toggleGroup('Friends'))
    expect(result.current.filteredEvents).toHaveLength(1)
    expect(result.current.filteredEvents[0].name).toBe('Alice')
  })

  test('availableGroups updates when events change', () => {
    const { result } = renderHook(() => useCalendarState())
    expect(result.current.availableGroups).toEqual([])
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    expect(result.current.availableGroups).toContain('Family')
    expect(result.current.availableGroups).toContain('Friends')
  })

  test('setMonth and setYear update selected period', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.setMonth(12))
    expect(result.current.selectedMonth).toBe(12)
    act(() => result.current.setYear(2030))
    expect(result.current.selectedYear).toBe(2030)
  })

  test('toggleHoliday adds/removes holidays from enabledHolidays', () => {
    const { result } = renderHook(() => useCalendarState())
    expect(result.current.enabledHolidays).toContain('CHRISTMAS DAY')
    act(() => result.current.toggleHoliday('CHRISTMAS DAY'))
    expect(result.current.enabledHolidays).not.toContain('CHRISTMAS DAY')
    act(() => result.current.toggleHoliday('CHRISTMAS DAY'))
    expect(result.current.enabledHolidays).toContain('CHRISTMAS DAY')
  })

  test('addCustomHoliday appends to customHolidays', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addCustomHoliday({ name: 'PIZZA DAY', month: 2, day: 9 }))
    expect(result.current.customHolidays).toHaveLength(1)
    expect(result.current.customHolidays[0].name).toBe('PIZZA DAY')
  })

  test('filteredEvents excludes events with empty groups', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'Ungrouped', type: 'B', month: 5, day: 1, groups: [],
    }))
    act(() => result.current.setMonth(5))
    expect(result.current.filteredEvents).toHaveLength(0)
  })

  test('addGroup adds to availableGroups and enabledGroups', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addGroup('Work'))
    expect(result.current.availableGroups).toContain('Work')
    expect(result.current.enabledGroups).toContain('Work')
  })

  test('renameGroup updates group name across all events and state', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    act(() => result.current.renameGroup('Family', 'Relatives'))
    // All events that had Family should now have Relatives
    const aliceGroups = result.current.events.find((e) => e.name === 'Alice')!.groups
    expect(aliceGroups).toContain('Relatives')
    expect(aliceGroups).not.toContain('Family')
    // Carol had both Family and Friends
    const carolGroups = result.current.events.find((e) => e.name === 'Carol')!.groups
    expect(carolGroups).toContain('Relatives')
    expect(carolGroups).toContain('Friends')
    // enabledGroups and availableGroups should reflect the rename
    expect(result.current.availableGroups).toContain('Relatives')
    expect(result.current.availableGroups).not.toContain('Family')
    expect(result.current.enabledGroups).toContain('Relatives')
    expect(result.current.enabledGroups).not.toContain('Family')
  })

  test('deleteGroup removes group from all events and state', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.loadEventsFromCsv(CSV_TWO_GROUPS))
    act(() => result.current.deleteGroup('Family'))
    // Alice only had Family — should now have empty groups
    const aliceGroups = result.current.events.find((e) => e.name === 'Alice')!.groups
    expect(aliceGroups).toEqual([])
    // Carol had Family and Friends — should only have Friends
    const carolGroups = result.current.events.find((e) => e.name === 'Carol')!.groups
    expect(carolGroups).toEqual(['Friends'])
    // Family should be gone from available and enabled groups
    expect(result.current.availableGroups).not.toContain('Family')
    expect(result.current.enabledGroups).not.toContain('Family')
  })

  test('setCustomTitle updates the custom title', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.setCustomTitle('My Calendar'))
    expect(result.current.customTitle).toBe('My Calendar')
  })

  test('removeCustomHoliday removes a custom holiday by name', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addCustomHoliday({ name: 'PIZZA DAY', month: 2, day: 9 }))
    act(() => result.current.addCustomHoliday({ name: 'TACO DAY', month: 10, day: 4 }))
    expect(result.current.customHolidays).toHaveLength(2)
    act(() => result.current.removeCustomHoliday('PIZZA DAY'))
    expect(result.current.customHolidays).toHaveLength(1)
    expect(result.current.customHolidays[0].name).toBe('TACO DAY')
  })

  test('filteredEvents includes R events regardless of selected month', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'CHURCH - 9 AM',
      type: 'R',
      month: 0,
      day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    }))
    act(() => result.current.addGroup('Hooper'))

    act(() => result.current.setMonth(3))
    expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
    act(() => result.current.setMonth(8))
    expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
  })

  test('filteredEvents excludes R events when their group is disabled', () => {
    const { result } = renderHook(() => useCalendarState())
    act(() => result.current.addEvent({
      name: 'CHURCH - 9 AM',
      type: 'R',
      month: 0,
      day: 0,
      groups: ['Hooper'],
      recurrence: { kind: 'weekly', dayOfWeek: 0 },
    }))
    act(() => result.current.addGroup('Hooper'))

    expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(true)
    act(() => result.current.toggleGroup('Hooper'))
    expect(result.current.filteredEvents.some(e => e.name === 'CHURCH - 9 AM')).toBe(false)
  })
})
