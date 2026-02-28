// ABOUTME: Tests for ExportCsvButton component.
// ABOUTME: Verifies the button is disabled when no events and enabled otherwise.

import { render, screen } from '@testing-library/react'
import { ExportCsvButton } from './ExportCsvButton'

describe('ExportCsvButton', () => {
  test('export button disabled when no events, enabled when events exist', () => {
    const { rerender } = render(<ExportCsvButton events={[]} />)
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()

    rerender(
      <ExportCsvButton
        events={[{ id: '1', name: 'Alice', type: 'B', month: 3, day: 15, groups: [] }]}
      />,
    )
    expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled()
  })
})
