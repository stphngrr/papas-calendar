// ABOUTME: Tests for recurrence rule parsing, expansion, formatting, and serialization.
// ABOUTME: Validates weekly and nth-weekday patterns against known month layouts.

import { describe, test, expect } from 'vitest'
import { parseRecurrenceRule } from './recurrence'

describe('parseRecurrenceRule', () => {
  test('parses weekly:Sunday', () => {
    expect(parseRecurrenceRule('weekly:Sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
  })

  test('parses weekly:Tuesday', () => {
    expect(parseRecurrenceRule('weekly:Tuesday')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses weekly:Saturday', () => {
    expect(parseRecurrenceRule('weekly:Saturday')).toEqual({ kind: 'weekly', dayOfWeek: 6 })
  })

  test('is case-insensitive', () => {
    expect(parseRecurrenceRule('weekly:sunday')).toEqual({ kind: 'weekly', dayOfWeek: 0 })
    expect(parseRecurrenceRule('WEEKLY:TUESDAY')).toEqual({ kind: 'weekly', dayOfWeek: 2 })
  })

  test('parses nth:1:Sunday', () => {
    expect(parseRecurrenceRule('nth:1:Sunday')).toEqual({ kind: 'nth', n: 1, dayOfWeek: 0 })
  })

  test('parses nth:3:Wednesday', () => {
    expect(parseRecurrenceRule('nth:3:Wednesday')).toEqual({ kind: 'nth', n: 3, dayOfWeek: 3 })
  })

  test('parses nth:5:Friday', () => {
    expect(parseRecurrenceRule('nth:5:Friday')).toEqual({ kind: 'nth', n: 5, dayOfWeek: 5 })
  })

  test('returns null for unknown prefix', () => {
    expect(parseRecurrenceRule('daily:Monday')).toBeNull()
  })

  test('returns null for invalid day name', () => {
    expect(parseRecurrenceRule('weekly:Sundayy')).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(parseRecurrenceRule('')).toBeNull()
  })

  test('returns null for nth with n=0', () => {
    expect(parseRecurrenceRule('nth:0:Sunday')).toBeNull()
  })

  test('returns null for nth with n=6', () => {
    expect(parseRecurrenceRule('nth:6:Sunday')).toBeNull()
  })

  test('returns null for nth with non-numeric n', () => {
    expect(parseRecurrenceRule('nth:abc:Sunday')).toBeNull()
  })

  test('returns null for nth with missing parts', () => {
    expect(parseRecurrenceRule('nth:1')).toBeNull()
  })

  test('returns null for weekly with missing day', () => {
    expect(parseRecurrenceRule('weekly:')).toBeNull()
    expect(parseRecurrenceRule('weekly')).toBeNull()
  })
})
