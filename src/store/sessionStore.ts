import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { callName, type CourtCall } from '../core/announcer'
import { applyGame, joinCredit, pickNextFour } from '../core/matching'
import type { Court, CourtPlayers, GameResult, MatchingMode, Player, ScoreLimit, SkillLevel, Team } from '../types/models'
import { useAnnouncer } from './announcerStore'

export type SessionStatus = 'none' | 'live'

type SessionData = {
  status: SessionStatus
  name: string
  venue: string
  rentalStartsAt: number
  rentalEndsAt: number
  scoreLimit: ScoreLimit
  mode: MatchingMode
  autoFill: boolean
  lastCallMinutes: number
  courts: Court[]
  results: GameResult[]
  players: Player[]
  nextUp: CourtPlayers | null
  option: number
}

export type SessionSetup = {
  name: string
  venue: string
  rentalStartsAt: number
  rentalEndsAt: number
  courtCount: number
  scoreLimit: ScoreLimit
  mode: MatchingMode
}

type SessionActions = {
  addPlayer: (name: string, skill: SkillLevel) => void
  removePlayer: (id: string) => void
  setResting: (id: string, resting: boolean) => void
  setMode: (mode: MatchingMode) => void
  setScoreLimit: (limit: ScoreLimit) => void
  setAutoFill: (on: boolean) => void
  setLastCallMinutes: (minutes: number) => void
  setRentalHours: (hours: number) => void
  addCourt: () => void
  removeCourt: () => void
  anotherOption: () => void
  setNextSlot: (slot: number, playerId: string) => void
  fillCourt: (court: number) => void
  holdCourt: (court: number) => void
  finishGame: (court: number, winner: Team | null) => void
  callAgain: (court: number) => void
  newSession: (setup: SessionSetup) => void
  endSession: () => void
}

const MAX_RESULTS = 40

export const WINNER_SHOW_MS = 10_000

export function onCourtIds(courts: Court[]): Set<string> {
  return new Set(courts.flatMap((c) => c.players ?? []))
}

export function waitingPlayers(s: Pick<SessionData, 'players' | 'courts'>): Player[] {
  const busy = onCourtIds(s.courts)
  return s.players.filter((p) => p.status === 'active' && !busy.has(p.id))
}

export function upNext(s: Pick<SessionData, 'players' | 'courts' | 'mode' | 'nextUp' | 'option'>): CourtPlayers | null {
  const waiting = waitingPlayers(s)
  const ids = new Set(waiting.map((p) => p.id))
  if (s.nextUp && s.nextUp.every((id) => ids.has(id))) return s.nextUp
  return pickNextFour(waiting, s.mode, s.option)
}

export function typicalGameMs(results: GameResult[]): number {
  const recent = results.slice(0, 8)
  if (recent.length === 0) return 15 * 60_000
  return recent.reduce((sum, r) => sum + (r.endedAt - r.startedAt), 0) / recent.length
}

export function newGamesAllowed(s: Pick<SessionData, 'rentalEndsAt' | 'lastCallMinutes'>, now: number): boolean {
  return now < s.rentalEndsAt - s.lastCallMinutes * 60_000
}

export function rentalHours(s: Pick<SessionData, 'rentalStartsAt' | 'rentalEndsAt'>): number {
  return Math.round(((s.rentalEndsAt - s.rentalStartsAt) / 3_600_000) * 2) / 2
}

export function shortNames(players: Player[]): Map<string, string> {
  const all = players.map((p) => p.name)
  return new Map(players.map((p) => [p.id, callName(p.name, all)]))
}

function courtCall(players: Player[], court: number, four: CourtPlayers): CourtCall {
  const names = shortNames(players)
  const n = (id: string) => names.get(id) ?? '?'
  return { court: court + 1, teamA: [n(four[0]), n(four[1])], teamB: [n(four[2]), n(four[3])] }
}

function newPlayer(name: string, skill: SkillLevel, credit: number, now: number): Player {
  return {
    id: `${name.toLowerCase().replace(/\W+/g, '-')}-${now.toString(36)}`,
    name,
    skill,
    status: 'active',
    games: 0,
    wins: 0,
    credit,
    queuedAt: now,
    partners: {},
    opponents: {},
    createdAt: now,
  }
}

function emptyState(): SessionData {
  return {
    status: 'none',
    name: '',
    venue: '',
    rentalStartsAt: 0,
    rentalEndsAt: 0,
    scoreLimit: 11,
    mode: 'balanced',
    autoFill: true,
    lastCallMinutes: 5,
    courts: [],
    results: [],
    players: [],
    nextUp: null,
    option: 0,
  }
}

export const useSession = create<SessionData & SessionActions>()(
  persist(
    (set, get) => {
      const putOnCourt = (i: number) => {
        const s = get()
        const four = upNext(s)
        if (!four) return
        set({
          courts: s.courts.map((c, j) => (j === i ? { players: four, startedAt: Date.now(), fillAt: null } : c)),
          nextUp: null,
          option: 0,
        })
        useAnnouncer.getState().announce({ kind: 'call', ...courtCall(s.players, i, four) })
      }

      return {
        ...emptyState(),

        addPlayer: (name, skill) =>
          set((s) => {
            const credit = joinCredit(s.players.filter((p) => p.status === 'active'))
            return { players: [...s.players, newPlayer(name, skill, credit, Date.now())] }
          }),

        removePlayer: (id) =>
          set((s) => (onCourtIds(s.courts).has(id) ? s : { players: s.players.filter((p) => p.id !== id) })),

        setResting: (id, resting) =>
          set((s) => {
            if (onCourtIds(s.courts).has(id)) return s
            const others = s.players.filter((p) => p.status === 'active' && p.id !== id)
            return {
              players: s.players.map((p) => {
                if (p.id !== id) return p
                if (resting) return { ...p, status: 'resting' as const }
                const credit = Math.max(p.credit, joinCredit(others) - p.games)
                return { ...p, status: 'active' as const, credit, queuedAt: Date.now() }
              }),
            }
          }),

        setMode: (mode) => set({ mode, nextUp: null, option: 0 }),
        setScoreLimit: (scoreLimit) => set({ scoreLimit }),
        setAutoFill: (autoFill) =>
          set((s) => ({
            autoFill,
            courts: autoFill ? s.courts : s.courts.map((c) => ({ ...c, fillAt: null })),
          })),
        setLastCallMinutes: (lastCallMinutes) => set({ lastCallMinutes }),
        setRentalHours: (hours) =>
          set((s) => ({ rentalEndsAt: s.rentalStartsAt + Math.min(12, Math.max(1, hours)) * 3_600_000 })),

        addCourt: () =>
          set((s) => ({
            courts: [...s.courts, { players: null, startedAt: null, fillAt: s.autoFill && newGamesAllowed(s, Date.now()) ? Date.now() : null }],
          })),

        removeCourt: () =>
          set((s) => {
            const last = s.courts[s.courts.length - 1]
            if (s.courts.length <= 1 || last.players) return s
            return { courts: s.courts.slice(0, -1) }
          }),

        anotherOption: () => set((s) => ({ option: s.option + 1, nextUp: null })),

        setNextSlot: (slot, playerId) =>
          set((s) => {
            const current = upNext(s)
            if (!current) return s
            const next = [...current] as CourtPlayers
            const existing = next.indexOf(playerId)
            if (existing >= 0) [next[existing], next[slot]] = [next[slot], next[existing]]
            else next[slot] = playerId
            return { nextUp: next }
          }),

        fillCourt: (i) => {
          if (get().courts[i]?.players) return
          putOnCourt(i)
        },

        holdCourt: (i) =>
          set((s) => ({ courts: s.courts.map((c, j) => (j === i ? { ...c, fillAt: null } : c)) })),

        finishGame: (i, winner) => {
          const s = get()
          const court = s.courts[i]
          if (!court?.players || !court.startedAt) return
          const now = Date.now()
          const result: GameResult = { court: i + 1, players: court.players, winner, startedAt: court.startedAt, endedAt: now }
          const fillAt = s.autoFill && newGamesAllowed(s, now + WINNER_SHOW_MS) ? now + WINNER_SHOW_MS : null
          set({
            players: applyGame(s.players, court.players, winner, now),
            courts: s.courts.map((c, j) => (j === i ? { players: null, startedAt: null, fillAt } : c)),
            results: [result, ...s.results].slice(0, MAX_RESULTS),
          })
          if (winner) {
            const call = courtCall(s.players, i, court.players)
            useAnnouncer.getState().announce({
              kind: 'winner',
              court: i + 1,
              team: winner,
              winners: winner === 'A' ? call.teamA : call.teamB,
            })
          }
        },

        callAgain: (i) => {
          const s = get()
          const four = s.courts[i]?.players
          if (four) useAnnouncer.getState().announce({ kind: 'call', ...courtCall(s.players, i, four) })
        },

        newSession: (setup) =>
          set(() => {
            return {
              status: 'live',
              name: setup.name,
              venue: setup.venue,
              rentalStartsAt: setup.rentalStartsAt,
              rentalEndsAt: setup.rentalEndsAt,
              scoreLimit: setup.scoreLimit,
              mode: setup.mode,
              autoFill: true,
              lastCallMinutes: 5,
              courts: Array.from({ length: setup.courtCount }, () => ({ players: null, startedAt: null, fillAt: null })),
              results: [],
              players: [],
              nextUp: null,
              option: 0,
            }
          }),

        endSession: () => set(emptyState()),
      }
    },
    { name: 'openplay.demo-session', version: 7 },
  ),
)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'openplay.demo-session') void useSession.persist.rehydrate()
  })
}
