// ABOUTME: Type declarations for the lune moon phase library.
// ABOUTME: Covers only the functions we use: phase_hunt.

declare module 'lune' {
  interface PhaseResult {
    new_date: Date
    q1_date: Date
    full_date: Date
    q3_date: Date
    nextnew_date: Date
  }

  export function phase_hunt(date: Date): PhaseResult
}
