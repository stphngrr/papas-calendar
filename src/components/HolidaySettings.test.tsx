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
        onRemoveCustom={() => {}}
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

  test('rejects duplicate of existing custom holiday', () => {
    const onAddCustom = vi.fn()
    renderAndExpand({
      onAddCustom,
      customHolidays: [{ name: 'PIZZA DAY', month: 2, day: 9 }],
    })
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'PIZZA DAY' } })
    fireEvent.change(screen.getByLabelText(/holiday month/i), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(/holiday day/i), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /add holiday/i }))
    expect(onAddCustom).not.toHaveBeenCalled()
    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
  })

  test('rejects duplicate of built-in holiday', () => {
    const onAddCustom = vi.fn()
    renderAndExpand({ onAddCustom })
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'Christmas Day' } })
    fireEvent.click(screen.getByRole('button', { name: /add holiday/i }))
    expect(onAddCustom).not.toHaveBeenCalled()
    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
  })

  test('duplicate check is case-insensitive', () => {
    const onAddCustom = vi.fn()
    renderAndExpand({
      onAddCustom,
      customHolidays: [{ name: 'PIZZA DAY', month: 2, day: 9 }],
    })
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'pizza day' } })
    fireEvent.click(screen.getByRole('button', { name: /add holiday/i }))
    expect(onAddCustom).not.toHaveBeenCalled()
  })

  test('delete button calls onRemoveCustom with holiday name', () => {
    const onRemoveCustom = vi.fn()
    renderAndExpand({
      onRemoveCustom,
      customHolidays: [
        { name: 'PIZZA DAY', month: 2, day: 9 },
        { name: 'TACO DAY', month: 10, day: 4 },
      ],
    })
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    expect(deleteButtons).toHaveLength(2)
    fireEvent.click(deleteButtons[0])
    expect(onRemoveCustom).toHaveBeenCalledWith('PIZZA DAY')
  })

  test('holiday month is a dropdown with month names', () => {
    renderAndExpand()
    const monthSelect = screen.getByLabelText(/holiday month/i)
    expect(monthSelect.tagName).toBe('SELECT')
    const options = Array.from(monthSelect.querySelectorAll('option'))
    expect(options).toHaveLength(12)
    expect(options[0].textContent).toBe('January')
    expect(options[11].textContent).toBe('December')
  })

  test('clears duplicate error when name changes', () => {
    const onAddCustom = vi.fn()
    renderAndExpand({
      onAddCustom,
      customHolidays: [{ name: 'PIZZA DAY', month: 2, day: 9 }],
    })
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'PIZZA DAY' } })
    fireEvent.click(screen.getByRole('button', { name: /add holiday/i }))
    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/holiday name/i), { target: { value: 'TACO DAY' } })
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument()
  })
})
