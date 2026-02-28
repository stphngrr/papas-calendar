// ABOUTME: File upload component for loading CSV event data.
// ABOUTME: Reads the file as text and passes it to the parent via onLoad callback.

import { useCallback } from 'react'

interface CsvUploadProps {
  onLoad: (csvString: string) => void
  eventCount: number
  groupNames: string[]
}

export function CsvUpload({ onLoad, eventCount, groupNames }: CsvUploadProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onLoad(reader.result)
        }
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
    </div>
  )
}
