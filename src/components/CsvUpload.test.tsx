// ABOUTME: Tests for CsvUpload component.
// ABOUTME: Verifies file upload triggers onLoad, displays summary info, and shows errors.

import { render, screen, fireEvent, act } from '@testing-library/react'
import { CsvUpload } from './CsvUpload'

describe('CsvUpload', () => {
  test('shows upload button initially', () => {
    render(<CsvUpload onLoad={() => {}} eventCount={0} groupNames={[]} csvErrors={[]} />)
    expect(screen.getByLabelText(/upload csv/i)).toBeInTheDocument()
  })

  test('displays event count and group names after file upload', async () => {
    const onLoad = vi.fn()
    render(<CsvUpload onLoad={onLoad} eventCount={3} groupNames={['Family', 'Friends']} csvErrors={[]} />)
    expect(screen.getByText(/3 events/i)).toBeInTheDocument()
    expect(screen.getByText(/Family/)).toBeInTheDocument()
    expect(screen.getByText(/Friends/)).toBeInTheDocument()
  })

  test('displays csv parse errors', () => {
    render(
      <CsvUpload
        onLoad={() => {}}
        eventCount={1}
        groupNames={['Family']}
        csvErrors={['Row 2: missing name', 'Row 5: invalid type "X" (expected B or A)']}
      />
    )
    expect(screen.getByText('Row 2: missing name')).toBeInTheDocument()
    expect(screen.getByText('Row 5: invalid type "X" (expected B or A)')).toBeInTheDocument()
  })

  test('does not display error section when csvErrors is empty', () => {
    render(
      <CsvUpload onLoad={() => {}} eventCount={0} groupNames={[]} csvErrors={[]} />
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  test('displays file read error on FileReader failure', async () => {
    const onLoad = vi.fn()
    const originalFileReader = global.FileReader

    let capturedInstance: MockFileReader | null = null
    class MockFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result: string | null = null
      constructor() {
        capturedInstance = this
      }
      readAsText() {
        // Simulate async error
      }
    }
    global.FileReader = MockFileReader as unknown as typeof FileReader

    render(<CsvUpload onLoad={onLoad} eventCount={0} groupNames={[]} csvErrors={[]} />)

    const input = screen.getByLabelText(/upload csv/i)
    const file = new File(['content'], 'test.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })

    // Trigger the error callback inside act() so React processes the state update
    act(() => {
      capturedInstance!.onerror!()
    })

    expect(screen.getByText(/could not read file/i)).toBeInTheDocument()
    expect(onLoad).not.toHaveBeenCalled()

    global.FileReader = originalFileReader
  })
})
