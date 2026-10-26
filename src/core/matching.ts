import type { CourtPlayers, MatchingMode, Team } from '../types/models'

export type QueuePlayer = {
  id: string
  skill: number
  games: number
  wins: number
  credit: number
  queuedAt: number
  partners: Record<string, number>
  opponents: Record<string, number>
}

export const playedScore = (p: QueuePlayer) => p.games + p.credit

export function joinCredit(players: QueuePlayer[]): number {
  if (players.length === 0) return 0
  return Math.min(...players.map(playedScore))
}

export function queueOrder<T extends QueuePlayer>(waiting: T[]): T[] {
  return [...waiting].sort((a, b) => playedScore(a) - playedScore(b) || a.queuedAt - b.queuedAt || a.id.localeCompare(b.id))
}

const SPLITS: [number, number, number, number][] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
]

function splitCost(four: QueuePlayer[]): { cost: number; order: QueuePlayer[] } {
  let best: { cost: number; order: QueuePlayer[] } | null = null
  for (const [a1, a2, b1, b2] of SPLITS) {
    const A = [four[a1], four[a2]]
    const B = [four[b1], four[b2]]
    const gap = Math.abs(A[0].skill + A[1].skill - B[0].skill - B[1].skill)
    const repeatPartners = (A[0].partners[A[1].id] ?? 0) + (B[0].partners[B[1].id] ?? 0)
    const repeatOpponents = A.reduce((sum, x) => sum + B.reduce((s, y) => s + (x.opponents[y.id] ?? 0), 0), 0)
    const cost = gap * 10 + repeatPartners * 4 + repeatOpponents * 1.5
    if (!best || cost < best.cost) best = { cost, order: [...A, ...B] }
  }
  return best!
}

export function bestSplit(four: QueuePlayer[]): CourtPlayers {
  return splitCost(four).order.map((p) => p.id) as CourtPlayers
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (items.length < k) return []
  const [first, ...rest] = items
  return [...combinations(rest, k - 1).map((c) => [first, ...c]), ...combinations(rest, k)]
}

const LOOKAHEAD = 8

export function pickNextFour(waiting: QueuePlayer[], mode: MatchingMode, option = 0): CourtPlayers | null {
  if (waiting.length < 4) return null
  const order = queueOrder(waiting)
  const cutoff = playedScore(order[3])
  const mustPlay = order.filter((p) => playedScore(p) < cutoff)
  const tier = order.filter((p) => playedScore(p) === cutoff)
  const anchor = mustPlay.length < 4 ? [tier[0]] : []
  const pool = tier.slice(1, LOOKAHEAD)
  const open = 4 - mustPlay.length - anchor.length

  const position = new Map(order.map((p, i) => [p.id, i]))
  const scored = combinations(pool, open).map((extra) => {
    const four = [...mustPlay, ...anchor, ...extra]
    const levels = four.map((p) => p.skill)
    const spread = Math.max(...levels) - Math.min(...levels)
    const split = splitCost(four)
    const waitPenalty = extra.reduce((sum, p) => sum + position.get(p.id)!, 0) * 1.2
    const cost =
      mode === 'same'
        ? spread * 15 + split.cost * 0.6 + waitPenalty
        : split.cost * 1.5 - Math.min(spread, 1.5) * 2 + waitPenalty
    return { cost, order: split.order }
  })
  scored.sort((a, b) => a.cost - b.cost)
  const pick = scored[option % scored.length]
  return pick.order.map((p) => p.id) as CourtPlayers
}

export function applyGame<T extends QueuePlayer>(players: T[], court: CourtPlayers, winner: Team | null, now: number): T[] {
  const [a1, a2, b1, b2] = court
  const teams = { A: [a1, a2], B: [b1, b2] }
  const sideOf = new Map<string, 'A' | 'B'>([
    [a1, 'A'],
    [a2, 'A'],
    [b1, 'B'],
    [b2, 'B'],
  ])
  return players.map((p) => {
    const side = sideOf.get(p.id)
    if (!side) return p
    const other = side === 'A' ? 'B' : 'A'
    const partners = { ...p.partners }
    const opponents = { ...p.opponents }
    for (const mate of teams[side]) if (mate !== p.id) partners[mate] = (partners[mate] ?? 0) + 1
    for (const opp of teams[other]) opponents[opp] = (opponents[opp] ?? 0) + 1
    return {
      ...p,
      games: p.games + 1,
      wins: p.wins + (winner === side ? 1 : 0),
      queuedAt: now,
      partners,
      opponents,
    }
  })
}
