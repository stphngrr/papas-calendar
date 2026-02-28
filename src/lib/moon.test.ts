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

  it('returns moon phases for December 2025', () => {
    const phases = getMoonPhases(2025, 12)

    // Dec 2025 should have all four phase types
    expect(phases).toHaveLength(4)
    phases.forEach((phase) => {
      expect(phase.month).toBe(12)
      expect(phase.day).toBeGreaterThanOrEqual(1)
      expect(phase.day).toBeLessThanOrEqual(31)
    })

    // Cross-check against example PDF
    const fullMoon = phases.find((p) => p.type === 'Full Moon')
    expect(fullMoon).toBeDefined()
    expect(fullMoon!.day).toBe(4)

    const lastQtr = phases.find((p) => p.type === 'Last Qtr')
    expect(lastQtr).toBeDefined()
    expect(lastQtr!.day).toBe(11)

    const newMoon = phases.find((p) => p.type === 'New Moon')
    expect(newMoon).toBeDefined()
    expect(newMoon!.day).toBe(20)

    const firstQtr = phases.find((p) => p.type === 'First Qtr')
    expect(firstQtr).toBeDefined()
    expect(firstQtr!.day).toBe(27)
  })

  it('returns an array for any valid month', () => {
    // Every real month should return phases, but verify the function
    // always returns an array and never throws
    for (let m = 1; m <= 12; m++) {
      const phases = getMoonPhases(2025, m)
      expect(Array.isArray(phases)).toBe(true)
      expect(phases.length).toBeGreaterThanOrEqual(1)
      phases.forEach((phase) => {
        expect(phase.month).toBe(m)
      })
    }
  })
})
