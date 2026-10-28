import type { Language, Team } from '../types/models'
import { respellName } from './pronounce'

// Call name -> how the organizer said it should sound
export type SayAs = Record<string, string>

export type CourtCall = {
  court: number
  teamA: [string, string]
  teamB: [string, string]
  say?: SayAs
}

export type CallAnnouncement = CourtCall & { kind: 'call' }

export type WinnerAnnouncement = {
  kind: 'winner'
  court: number
  team: Team
  winners: [string, string]
  say?: SayAs
}

export type Announcement = CallAnnouncement | WinnerAnnouncement

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
]

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

export const courtWord = numberWord

// "Ma. Cristina Reyes" goes by "Ma. Cristina", not "Ma."
function splitFirst(fullName: string): [string, string[]] {
  const parts = fullName.trim().split(/\s+/)
  const take = /^ma\.?$/i.test(parts[0]) && parts.length > 1 ? 2 : 1
  return [parts.slice(0, take).join(' '), parts.slice(take)]
}

export function callName(fullName: string, everyone: string[]): string {
  const [first, rest] = splitFirst(fullName)
  const clash = everyone.some((other) => other !== fullName && splitFirst(other)[0].toLowerCase() === first.toLowerCase())
  return clash && rest.length > 0 ? `${first} ${rest[0][0].toUpperCase()}.` : first
}

type Words = {
  call: (c: CourtCall) => string[]
  winner: (court: number, team: Team, w: [string, string]) => string[]
}

const EN: Words = {
  call: ({ court, teamA, teamB }) => {
    const c = numberWord(court)
    return [`Next game, Court ${c}.`, `Team A: ${teamA[0]} and ${teamA[1]}.`, `Team B: ${teamB[0]} and ${teamB[1]}.`, `Court ${c}, please.`]
  },
  winner: (court, team, w) => [
    `Game over on Court ${numberWord(court)}.`,
    `The winner is Team ${team}: ${w[0]} and ${w[1]}!`,
    'Congratulations!',
  ],
}

const TL: Words = {
  call: ({ court, teamA, teamB }) => {
    const c = numberWord(court)
    return [`Susunod na laro, Court ${c}.`, `Team A: ${teamA[0]} at ${teamA[1]}.`, `Team B: ${teamB[0]} at ${teamB[1]}.`, `Pumunta na po sa Court ${c}.`]
  },
  winner: (court, team, w) => [
    `Tapos na ang laro sa Court ${numberWord(court)}.`,
    `Panalo ang Team ${team}: ${w[0]} at ${w[1]}!`,
    'Congratulations po!',
  ],
}

const TL_RESPELLED: Words = {
  call: ({ court, teamA, teamB }) => {
    const c = numberWord(court)
    return [`Soo soo nod nah lah roh. Court ${c}.`, `Team A: ${teamA[0]}, aht ${teamA[1]}.`, `Team B: ${teamB[0]}, aht ${teamB[1]}.`, `Poo moon tah nah poh, sah Court ${c}.`]
  },
  winner: EN.winner,
}

function rawLines(a: Announcement, w: Words): string[] {
  switch (a.kind) {
    case 'call':
      return w.call(a)
    case 'winner':
      return w.winner(a.court, a.team, a.winners)
  }
}

function linesWith(a: Announcement, w: Words): string[] {
  return rawLines(a, w).map((line) => line.replace(/\.\./g, '.').replace(/\.([!,])/g, '$1'))
}

export function announcementLines(a: Announcement, lang: Language): string[] {
  return linesWith(a, lang === 'tl' ? TL : EN)
}

export function spokenName(name: string, sayAs: string | undefined, hasTagalogVoice: boolean): string {
  if (sayAs?.trim()) return sayAs.trim()
  return hasTagalogVoice ? name : respellName(name)
}

function withSpokenNames(a: Announcement, hasTagalogVoice: boolean): Announcement {
  const say = (name: string) => spokenName(name, a.say?.[name], hasTagalogVoice)
  const pair = ([x, y]: [string, string]): [string, string] => [say(x), say(y)]
  return a.kind === 'call'
    ? { ...a, teamA: pair(a.teamA), teamB: pair(a.teamB) }
    : { ...a, winners: pair(a.winners) }
}

export function spokenLines(a: Announcement, lang: Language, hasTagalogVoice: boolean): string[] {
  const spoken = withSpokenNames(a, hasTagalogVoice)
  if (lang !== 'tl' || hasTagalogVoice) return announcementLines(spoken, lang)
  return linesWith(spoken, TL_RESPELLED)
}
