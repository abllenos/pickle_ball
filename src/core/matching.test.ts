import { describe, expect, it } from 'vitest'
import { applyGame, joinCredit, pickNextFour, playedScore, queueOrder, type QueuePlayer } from './matching'
import type { CourtPlayers } from '../types/models'

const SKILLS = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

function makePlayers(n: number): QueuePlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    skill: SKILLS[i % SKILLS.length],
    games: 0,
    wins: 0,
    credit: 0,
    queuedAt: i,
    partners: {},
    opponents: {},
  }))
}

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31
    return s / 2 ** 31
  }
}

function simulate(n: number, courtCount: number, minutes: number, mode: 'same' | 'balanced' = 'balanced') {
  let players = makePlayers(n)
  const random = rng(42)
  const courts: { four: CourtPlayers; endsAt: number }[] = []
  const onCourt = () => new Set(courts.flatMap((c) => c.four))
  const fill = (now: number) => {
    const waiting = players.filter((p) => !onCourt().has(p.id))
    const four = pickNextFour(waiting, mode)
    if (four) courts.push({ four, endsAt: now + 8 + random() * 14 })
  }
  for (let i = 0; i < courtCount; i++) fill(0)

  let maxSpreadStarted = 0
  for (let guard = 0; guard < 10_000; guard++) {
    courts.sort((a, b) => a.endsAt - b.endsAt)
    const done = courts.shift()!
    if (done.endsAt > minutes) break
    players = applyGame(players, done.four, random() < 0.5 ? 'A' : 'B', done.endsAt)
    fill(done.endsAt)
    const playing = onCourt()
    const started = players.map((p) => p.games + (playing.has(p.id) ? 1 : 0))
    maxSpreadStarted = Math.max(maxSpreadStarted, Math.max(...started) - Math.min(...started))
  }
  return { players, maxSpreadStarted }
}

describe('pickNextFour', () => {
  it('needs four waiting players', () => {
    expect(pickNextFour(makePlayers(3), 'balanced')).toBeNull()
  })

  it('always takes the longest-waiting player with the fewest games', () => {
    const players = makePlayers(10).map((p, i) => ({ ...p, games: i < 2 ? 1 : 2 }))
    const four = pickNextFour(players, 'balanced')!
    expect(four).toContain('p0')
    expect(four).toContain('p1')
  })

  it('never skips someone who has played less', () => {
    const players = makePlayers(12).map((p) => ({ ...p, games: p.id === 'p11' ? 0 : 3 }))
    expect(pickNextFour(players, 'same')).toContain('p11')
  })

  it('gives another option on request', () => {
    const players = makePlayers(12)
    expect(pickNextFour(players, 'balanced', 0)).not.toEqual(pickNextFour(players, 'balanced', 1))
  })

  it('keeps similar levels together in same-level mode', () => {
    const players = makePlayers(12)
    const four = pickNextFour(players, 'same')!
    const levels = four.map((id) => players.find((p) => p.id === id)!.skill)
    expect(Math.max(...levels) - Math.min(...levels)).toBeLessThanOrEqual(1)
  })
})

describe('a whole session with uneven game lengths', () => {
  it('keeps games even (18 players, 4 courts, 3 hours)', () => {
    const { players, maxSpreadStarted } = simulate(18, 4, 180)
    const games = players.map((p) => p.games)
    expect(Math.min(...games)).toBeGreaterThanOrEqual(8)
    expect(maxSpreadStarted).toBeLessThanOrEqual(2)
    expect(Math.max(...games) - Math.min(...games)).toBeLessThanOrEqual(2)
  })

  it('stays fair with a tight crowd (9 players, 2 courts)', () => {
    const { players } = simulate(9, 2, 120, 'same')
    const games = players.map((p) => p.games)
    expect(Math.max(...games) - Math.min(...games)).toBeLessThanOrEqual(2)
  })

  it('spreads partners around', () => {
    const { players } = simulate(16, 3, 120)
    const games = Math.max(...players.map((p) => p.games))
    const maxRepeat = Math.max(...players.flatMap((p) => Object.values(p.partners)))
    expect(maxRepeat).toBeLessThanOrEqual(Math.ceil(games / 3))
  })
})

describe('joinCredit', () => {
  it('lets a late arrival start level with the least-played player', () => {
    const { players } = simulate(16, 3, 60)
    const credit = joinCredit(players)
    expect(credit).toBe(Math.min(...players.map(playedScore)))
    const late: QueuePlayer = { ...makePlayers(1)[0], id: 'late', credit, queuedAt: 10_000 }
    expect(queueOrder([...players, late])[0].id).not.toBe('late')
  })
})
