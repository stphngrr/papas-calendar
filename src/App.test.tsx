// ABOUTME: Smoke test for the root App component.
// ABOUTME: Verifies the app renders without crashing.

import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the app title', () => {
  render(<App />)
  expect(screen.getByText("Papa's Calendar")).toBeInTheDocument()
})
