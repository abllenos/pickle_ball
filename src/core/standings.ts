export type Standing = { id: string; wins: number; games: number }

export function winRate(p: Standing): number {
  return p.games === 0 ? 0 : p.wins / p.games
}

export function rankPlayers<T extends Standing>(players: T[]): T[] {
  return [...players]
    .filter((p) => p.games > 0)
    .sort((a, b) => b.wins - a.wins || winRate(b) - winRate(a) || b.games - a.games)
}
