// ABOUTME: Tests for moon phase computation using the lune library.
// ABOUTME: Validates getMoonPhases against known astronomical data.

import { describe, it, expect } from 'vitest'
import { getMoonPhases } from './moon'
import type { MoonPhase } from '../types'

describe('getMoonPhases', () => {
  it('returns moon phases for February 2026', () => {
    const phases = getMoonPhases(2026, 2)

    expect(phases.length).toBeGreaterThanOrEqual(2)
    phases.forEach((phase) => {
      expect(phase.month).toBe(2)
      expect(phase.day).toBeGreaterThanOrEqual(1)
      expect(phase.day).toBeLessThanOrEqual(28)
      expect(['Full Moon', 'New Moon', 'First Qtr', 'Last Qtr']).toContain(phase.type)
    })

    // Cross-check against example PDF
    const fullMoon = phases.find((p) => p.type === 'Full Moon')
    expect(fullMoon).toBeDefined()
    expect(fullMoon!.day).toBe(1)

    const lastQtr = phases.find((p) => p.type === 'Last Qtr')
    expect(lastQtr).toBeDefined()
    expect(lastQtr!.day).toBe(9)
  })
})
