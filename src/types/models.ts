export type SkillLevel = 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0
export const SKILL_LEVELS: SkillLevel[] = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

export type MatchingMode = 'same' | 'balanced'
export type PlayerStatus = 'active' | 'resting'
export type Team = 'A' | 'B'
export type Language = 'en' | 'tl'
export type VoiceStyle = 'standard' | 'narrator'

export const SCORE_LIMITS = [11, 15, 21] as const
export type ScoreLimit = (typeof SCORE_LIMITS)[number]

export type Millis = number

export type Player = {
  id: string
  name: string
  skill: SkillLevel
  status: PlayerStatus
  games: number
  wins: number
  credit: number
  queuedAt: Millis
  partners: Record<string, number>
  opponents: Record<string, number>
  createdAt: Millis
}

export type CourtPlayers = [string, string, string, string]

export type Court = {
  players: CourtPlayers | null
  startedAt: Millis | null
  fillAt: Millis | null
}

export type GameResult = {
  court: number
  players: CourtPlayers
  winner: Team | null
  startedAt: Millis
  endedAt: Millis
}

export type Session = {
  name: string
  venue: string
  rentalStartsAt: Millis
  rentalEndsAt: Millis
  scoreLimit: ScoreLimit
  mode: MatchingMode
  autoFill: boolean
  courts: Court[]
  results: GameResult[]
}
