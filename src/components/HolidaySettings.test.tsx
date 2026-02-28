// ABOUTME: Tests for HolidaySettings component.
// ABOUTME: Verifies holiday checkboxes and custom holiday form.

import { render, screen, fireEvent } from '@testing-library/react'
import { HolidaySettings } from './HolidaySettings'
import { HOLIDAY_DEFINITIONS } from '../lib/holidays'

const allHolidayNames = HOLIDAY_DEFINITIONS.map((d) => d.name)

describe('HolidaySettings', () => {
  function renderAndExpand(props: Partial<Parameters<typeof HolidaySettings>[0]> = {}) {
    const result = render(
      <HolidaySettings
        enabledHolidays={allHolidayNames}
        customHolidays={[]}
        onToggle={() => {}}
        onAddCustom={() => {}}
        {...props}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /show holiday settings/i }))
    return result
  }

  test('shows all holidays with checkboxes', () => {
    renderAndExpand()
    expect(screen.getByLabelText('CHRISTMAS DAY')).toBeChecked()
    expect(screen.getByLabelText('HALLOWEEN')).toBeChecked()
  })

  test('unchecking a holiday calls onToggle', () => {
    const onToggle = vi.fn()
    renderAndExpand({ onToggle })
    fireEvent.click(screen.getByLabelText('CHRISTMAS DAY'))
    expect(onToggle).toHaveBeenCalledWith('CHRISTMAS DAY')
  })

  test('adding a custom holiday calls onAddCustom', () => {
    const onAddCustom = vi.fn()
    renderAndExpand({ onAddCustom })
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'PIZZA DAY' } })
    fireEvent.change(screen.getByLabelText(/holiday month/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/holiday day/i), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /add holiday/i }))
    expect(onAddCustom).toHaveBeenCalledWith({ name: 'PIZZA DAY', month: 2, day: 9 })
  })
})
