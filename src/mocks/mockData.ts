import type { Announcement } from '../core/announcer'
import type { SkillLevel } from '../types/models'

export const mockSession = {
  name: 'Saturday Open Play',
  venue: '[VENUE NAME]',
  dateLabel: 'Today, 7:00–10:00 AM',
  fee: '₱[FEE]',
  courtCount: 4,
  scoreLimit: 11 as const,
  rentalHours: 3,
}

export const mockRoster: { name: string; skill: SkillLevel }[] = [
  { name: 'Joy Bautista', skill: 2.5 },
  { name: 'Mika Santos', skill: 2.5 },
  { name: 'Trisha Aquino', skill: 3.0 },
  { name: 'Migs Fernandez', skill: 3.0 },
  { name: 'Ella Uy', skill: 3.0 },
  { name: 'Grace Lim', skill: 3.0 },
  { name: 'Juan Reyes', skill: 3.0 },
  { name: 'Juan Dela Cruz', skill: 3.5 },
  { name: 'Maria Santos', skill: 3.5 },
  { name: 'Nonoy Cabahug', skill: 3.5 },
  { name: 'Andrea Lim', skill: 3.5 },
  { name: 'Carlo Garcia', skill: 3.5 },
  { name: 'Paolo Reyes', skill: 3.5 },
  { name: 'Ken Villanueva', skill: 4.0 },
  { name: 'Liza Ramos', skill: 4.0 },
  { name: 'Rico Mendoza', skill: 4.0 },
  { name: 'Bea Tan', skill: 4.5 },
  { name: 'Leo Navarro', skill: 4.5 },
]

export const mockTestCall: Announcement = {
  kind: 'call',
  court: 4,
  teamA: ['Joy', 'Trisha'],
  teamB: ['Migs', 'Ella'],
}
