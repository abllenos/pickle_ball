import { describe, expect, it } from 'vitest'
import { announcementLines, callName, courtWord, spokenLines, type Announcement } from './announcer'

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
})
