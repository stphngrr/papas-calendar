// ABOUTME: Tests for MonthYearSelector component.
// ABOUTME: Verifies month and year change callbacks fire correctly.

import { render, screen, fireEvent } from '@testing-library/react'
import { MonthYearSelector } from './MonthYearSelector'

describe('MonthYearSelector', () => {
  test('changing month calls onMonthChange', () => {
    const onMonthChange = vi.fn()
    render(
      <MonthYearSelector month={1} year={2026} onMonthChange={onMonthChange} onYearChange={() => {}} />,
    )
    fireEvent.change(screen.getByLabelText(/month/i), { target: { value: '6' } })
    expect(onMonthChange).toHaveBeenCalledWith(6)
  })

  test('changing year calls onYearChange', () => {
    const onYearChange = vi.fn()
    render(
      <MonthYearSelector month={1} year={2026} onMonthChange={() => {}} onYearChange={onYearChange} />,
    )
    fireEvent.change(screen.getByLabelText(/year/i), { target: { value: '2030' } })
    expect(onYearChange).toHaveBeenCalledWith(2030)
  })
})
