// ABOUTME: Text input for setting a custom calendar title.
// ABOUTME: The title is used as the heading on the generated PDF.

interface CustomTitleInputProps {
  value: string
  onChange: (title: string) => void
}

export function CustomTitleInput({ value, onChange }: CustomTitleInputProps) {
  return (
    <label>
      Title
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
