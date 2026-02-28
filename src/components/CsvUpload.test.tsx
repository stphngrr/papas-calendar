// ABOUTME: Tests for CsvUpload component.
// ABOUTME: Verifies file upload triggers onLoad and displays summary info.

import { render, screen } from '@testing-library/react'
import { CsvUpload } from './CsvUpload'

describe('CsvUpload', () => {
  test('shows upload button initially', () => {
    render(<CsvUpload onLoad={() => {}} eventCount={0} groupNames={[]} />)
    expect(screen.getByLabelText(/upload csv/i)).toBeInTheDocument()
  })

  test('displays event count and group names after file upload', async () => {
    const onLoad = vi.fn()
    render(<CsvUpload onLoad={onLoad} eventCount={3} groupNames={['Family', 'Friends']} />)
    expect(screen.getByText(/3 events/i)).toBeInTheDocument()
    expect(screen.getByText(/Family/)).toBeInTheDocument()
    expect(screen.getByText(/Friends/)).toBeInTheDocument()
  })
})
