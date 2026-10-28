import { describe, expect, it } from 'vitest'
import { announcementLines, callName, courtWord, spokenLines, type Announcement } from './announcer'
import { respellName } from './pronounce'

const call: Announcement = { kind: 'call', court: 3, teamA: ['Joy', 'Trisha'], teamB: ['Migs', 'Ella'] }
const win: Announcement = { kind: 'winner', court: 2, team: 'B', winners: ['Bea', 'Joy'] }

describe('courtWord', () => {
  it('speaks numbers as words up to twenty', () => {
    expect(courtWord(4)).toBe('four')
    expect(courtWord(20)).toBe('twenty')
    expect(courtWord(21)).toBe('21')
  })
})

describe('callName', () => {
  it('uses the first name only', () => {
    expect(callName('Maria Santos', ['Maria Santos', 'Juan Dela Cruz'])).toBe('Maria')
  })

  it('adds the last initial when first names clash', () => {
    expect(callName('Juan Dela Cruz', ['Juan Dela Cruz', 'Juan Reyes'])).toBe('Juan D.')
  })
})

describe('announcementLines', () => {
  it('builds the English call', () => {
    expect(announcementLines(call, 'en')).toEqual([
      'Next game, Court three.',
      'Team A: Joy and Trisha.',
      'Team B: Migs and Ella.',
      'Court three, please.',
    ])
  })

  it('builds the Tagalog winner call', () => {
    expect(announcementLines(win, 'tl')).toEqual([
      'Tapos na ang laro sa Court two.',
      'Panalo ang Team B: Bea at Joy!',
      'Congratulations po!',
    ])
  })
})

describe('punctuation', () => {
  it('does not double the period after an initial', () => {
    const a: Announcement = { kind: 'call', court: 1, teamA: ['Juan D.', 'Maria'], teamB: ['Ken', 'Juan R.'] }
    expect(announcementLines(a, 'en')[2]).toBe('Team B: Ken and Juan R.')
  })
})

describe('spokenLines', () => {
  it('respells Tagalog for an English voice', () => {
    expect(spokenLines(call, 'tl', false)[0]).toBe('Soo soo nod nah lah roh. Court three.')
  })

  it('keeps real Tagalog when a Tagalog voice exists', () => {
    expect(spokenLines(call, 'tl', true)[0]).toBe('Susunod na laro, Court three.')
  })

  it('respells Filipino names for an English voice', () => {
    const a: Announcement = { kind: 'call', court: 1, teamA: ['Jun', 'Rhea'], teamB: ['Juan D.', 'Joy'] }
    expect(spokenLines(a, 'en', false)[1]).toBe('Team A: Joon and Ray-ah.')
    expect(spokenLines(a, 'en', false)[2]).toBe('Team B: Wahn D. and Joy.')
  })

  it('leaves names alone for a Tagalog voice', () => {
    const a: Announcement = { kind: 'call', court: 1, teamA: ['Jun', 'Rhea'], teamB: ['Migs', 'Joy'] }
    expect(spokenLines(a, 'tl', true)[1]).toBe('Team A: Jun at Rhea.')
  })

  it("uses the organizer's own spelling first", () => {
    const a: Announcement = { kind: 'winner', court: 1, team: 'A', winners: ['Jun', 'Dhang'], say: { Dhang: 'Dahng' } }
    expect(spokenLines(a, 'en', false)[1]).toBe('The winner is Team A: Joon and Dahng!')
  })
})

describe('Filipino names', () => {
  it('calls "Ma." by the first two names', () => {
    expect(callName('Ma. Cristina Reyes', ['Ma. Cristina Reyes', 'Ma. Luisa Cruz'])).toBe('Ma. Cristina')
  })

  it('says Ma. as Maria and ñ as ny', () => {
    expect(respellName('Ma. Cristina')).toBe('Maria Cristina')
    expect(respellName('Niño')).toBe('Ninyo')
  })
})
