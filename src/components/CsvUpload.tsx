// ABOUTME: File upload component for loading CSV event data.
// ABOUTME: Reads the file as text, passes it to the parent, and displays parse errors.

import { useCallback, useState } from 'react'

interface CsvUploadProps {
  onLoad: (csvString: string) => void
  eventCount: number
  groupNames: string[]
  csvErrors: string[]
}

export function CsvUpload({ onLoad, eventCount, groupNames, csvErrors }: CsvUploadProps) {
  const [readError, setReadError] = useState<string | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setReadError(null)
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onLoad(reader.result)
        }
      }
      reader.onerror = () => {
        setReadError('Could not read file')
      }
      reader.readAsText(file)
    },
    [onLoad],
  )

  return (
    <div>
      <label>
        Upload CSV
        <input type="file" accept=".csv" onChange={handleChange} />
      </label>
      {eventCount > 0 && (
        <div>
          <span>{eventCount} events loaded</span>
          {groupNames.length > 0 && (
            <span> — Groups: {groupNames.join(', ')}</span>
          )}
        </div>
      )}
      {readError && (
        <div className="form-error">{readError}</div>
      )}
      {csvErrors.length > 0 && (
        <ul className="form-error">
          {csvErrors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
