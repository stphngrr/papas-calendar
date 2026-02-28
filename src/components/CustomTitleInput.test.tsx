// ABOUTME: Tests for CustomTitleInput component.
// ABOUTME: Verifies the input fires onChange when the user types.

import { render, screen, fireEvent } from '@testing-library/react'
import { CustomTitleInput } from './CustomTitleInput'

describe('CustomTitleInput', () => {
  test('custom title input updates on change', () => {
    const onChange = vi.fn()
    render(<CustomTitleInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Calendar' } })
    expect(onChange).toHaveBeenCalledWith('My Calendar')
  })
})
