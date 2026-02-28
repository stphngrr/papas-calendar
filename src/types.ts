// ABOUTME: Shared TypeScript types for calendar events, holidays, and moon phases.
// ABOUTME: These types are used across lib/, components/, and hooks/.

export type EventType = 'B' | 'A'

export interface CalendarEvent {
  id: string
  name: string
  type: EventType
  month: number
  day: number
  groups: string[]
}

export interface Holiday {
  name: string
  month: number
  day: number
}

export interface MoonPhase {
  type: 'Full Moon' | 'New Moon' | 'First Qtr' | 'Last Qtr'
  month: number
  day: number
}

export interface CalendarDay {
  day: number
  events: CalendarEvent[]
  holidays: Holiday[]
  moonPhases: MoonPhase[]
}

export interface CalendarGrid {
  year: number
  month: number
  weeks: (CalendarDay | null)[][]
  overflowEvents: CalendarEvent[]
}
