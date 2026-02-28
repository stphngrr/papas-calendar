// ABOUTME: Tests for date validation functions.
// ABOUTME: Verifies daysInMonth and isValidDay for all months and edge cases.

import { daysInMonth, isValidDay } from './validation'

describe('daysInMonth', () => {
  test('returns 31 for months with 31 days', () => {
    for (const month of [1, 3, 5, 7, 8, 10, 12]) {
      expect(daysInMonth(month)).toBe(31)
    }
  })

  test('returns 30 for months with 30 days', () => {
    for (const month of [4, 6, 9, 11]) {
      expect(daysInMonth(month)).toBe(30)
    }
  })

  test('returns 29 for February (leap day birthdays are valid)', () => {
    expect(daysInMonth(2)).toBe(29)
  })
})

describe('isValidDay', () => {
  test('returns true for valid days', () => {
    expect(isValidDay(1, 1)).toBe(true)
    expect(isValidDay(1, 31)).toBe(true)
    expect(isValidDay(2, 29)).toBe(true)
    expect(isValidDay(4, 30)).toBe(true)
  })

  test('returns false for day 0', () => {
    expect(isValidDay(1, 0)).toBe(false)
  })

  test('returns false for negative days', () => {
    expect(isValidDay(1, -5)).toBe(false)
  })

  test('returns false for day exceeding month maximum', () => {
    expect(isValidDay(2, 30)).toBe(false)
    expect(isValidDay(4, 31)).toBe(false)
    expect(isValidDay(6, 31)).toBe(false)
  })

  test('returns false for non-integer days', () => {
    expect(isValidDay(1, 1.5)).toBe(false)
  })
})
