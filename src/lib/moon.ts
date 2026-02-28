// ABOUTME: Computes moon phases for a given month using the lune library.
// ABOUTME: Returns Full Moon, New Moon, First Quarter, and Last Quarter dates.

import { phase_hunt } from 'lune'
import type { MoonPhase } from '../types'

export function getMoonPhases(year: number, month: number): MoonPhase[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const phases: MoonPhase[] = []
  const seen = new Set<string>()

  const addPhase = (type: MoonPhase['type'], date: Date) => {
    const d = date.getUTCDate()
    const m = date.getUTCMonth() + 1
    const y = date.getUTCFullYear()
    if (y === year && m === month && d >= 1 && d <= daysInMonth) {
      const key = `${type}-${d}`
      if (!seen.has(key)) {
        seen.add(key)
        phases.push({ type, month, day: d })
      }
    }
  }

  const collectPhases = (result: ReturnType<typeof phase_hunt>) => {
    addPhase('New Moon', result.new_date)
    addPhase('First Qtr', result.q1_date)
    addPhase('Full Moon', result.full_date)
    addPhase('Last Qtr', result.q3_date)
    addPhase('New Moon', result.nextnew_date)
  }

  // Hunt from the 1st to catch phases early in the month
  const firstResult = phase_hunt(new Date(Date.UTC(year, month - 1, 1)))
  collectPhases(firstResult)

  // Hunt from nextnew_date to catch phases later in the month
  const nextNew = firstResult.nextnew_date
  if (nextNew.getUTCFullYear() === year && nextNew.getUTCMonth() + 1 === month) {
    const secondResult = phase_hunt(new Date(nextNew.getTime() + 86400000))
    collectPhases(secondResult)
  }

  phases.sort((a, b) => a.day - b.day)
  return phases
}
