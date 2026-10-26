import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { Segmented } from '../../../components/Segmented'
import { useSession } from '../../../store/sessionStore'
import { SCORE_LIMITS, type MatchingMode, type ScoreLimit } from '../../../types/models'
import './SetupPage.css'

const modes: { value: MatchingMode; title: string; hint: string }[] = [
  { value: 'same', title: 'Same level', hint: 'Four players close in skill share a court' },
  { value: 'balanced', title: 'Balanced', hint: 'Mixed levels, teams add up the same' },
]

function nextHalfHour(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function todayAt(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

export default function SetupPage() {
  const navigate = useNavigate()
  const newSession = useSession((s) => s.newSession)
  const [name, setName] = useState('Saturday Open Play')
  const [venue, setVenue] = useState('')
  const [start, setStart] = useState(nextHalfHour)
  const [hours, setHours] = useState(3)
  const [courts, setCourts] = useState(4)
  const [scoreLimit, setScoreLimit] = useState<ScoreLimit>(11)
  const [mode, setMode] = useState<MatchingMode>('balanced')

  const endLabel = new Date(todayAt(start) + hours * 3_600_000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="app-shell">
      <main className="app-shell__content setup">
        <div className="setup__head">
          <Link to="/organizer" className="icon-btn" aria-label="Close">
            <Icon name="close" strokeWidth={2.2} />
          </Link>
          <h1 className="setup__title">New session</h1>
        </div>

        <form
          id="setup-form"
          className="setup__form"
          onSubmit={(event) => {
            event.preventDefault()
            const startsAt = todayAt(start)
            newSession({
              name: name.trim() || 'Open Play',
              venue: venue.trim(),
              rentalStartsAt: startsAt,
              rentalEndsAt: startsAt + hours * 3_600_000,
              courtCount: courts,
              scoreLimit,
              mode,
            })
            navigate('/organizer')
          }}
        >
          <section className="setup__card setup__card--fields">
            <div className="field">
              <label htmlFor="s-name" className="field__label">
                Session name
              </label>
              <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="s-venue" className="field__label">
                Venue
              </label>
              <input
                id="s-venue"
                className="input"
                placeholder="[VENUE NAME]"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </section>

          <section className="setup__card setup__card--rows">
            <div className="setup__row">
              <label htmlFor="s-start">
                <b>Court rental starts</b>
                <br />
                <span className="setup__hint">Today</span>
              </label>
              <input
                id="s-start"
                type="time"
                className="input setup__time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="setup__row">
              <span>
                <b>Hours rented</b>
                <br />
                <span className="setup__hint">Ends {endLabel}</span>
              </span>
              <span className="setup__stepper">
                <button
                  type="button"
                  className="setup__step"
                  aria-label="Fewer hours"
                  onClick={() => setHours((n) => Math.max(1, n - 1))}
                >
                  −
                </button>
                <span className="setup__count" aria-live="polite">
                  {hours}
                </span>
                <button
                  type="button"
                  className="setup__step"
                  aria-label="More hours"
                  onClick={() => setHours((n) => Math.min(12, n + 1))}
                >
                  +
                </button>
              </span>
            </div>
            <div className="setup__row">
              <span>
                <b>Courts</b>
                <br />
                <span className="setup__hint">You can change this during play</span>
              </span>
              <span className="setup__stepper">
                <button
                  type="button"
                  className="setup__step"
                  aria-label="Fewer courts"
                  onClick={() => setCourts((n) => Math.max(1, n - 1))}
                >
                  −
                </button>
                <span className="setup__count" aria-live="polite">
                  {courts}
                </span>
                <button
                  type="button"
                  className="setup__step"
                  aria-label="More courts"
                  onClick={() => setCourts((n) => Math.min(12, n + 1))}
                >
                  +
                </button>
              </span>
            </div>
            <div className="setup__row setup__row--stack">
              <span>
                <b>Play to</b>
                <br />
                <span className="setup__hint">A game ends when a team reaches this score</span>
              </span>
              <Segmented
                label="Score limit"
                value={String(scoreLimit)}
                onChange={(v) => setScoreLimit(Number(v) as ScoreLimit)}
                options={SCORE_LIMITS.map((n) => ({ value: String(n), label: `${n} points` }))}
              />
            </div>
          </section>

          <fieldset className="setup__modes">
            <legend className="field__label setup__legend">Match players by</legend>
            {modes.map((m) => (
              <label key={m.value} className={mode === m.value ? 'setup__mode setup__mode--on' : 'setup__mode'}>
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="setup__radio"
                />
                <span>
                  <b>{m.title}</b>
                  <br />
                  <span className="setup__hint">{m.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="setup__fair">
            When a game ends, the next four go straight onto that court. Whoever has played the fewest games goes
            first, then whoever has waited longest, so everyone gets the same playing time.
          </p>
        </form>

        <div className="spacer" />
        <button type="submit" form="setup-form" className="btn btn--primary btn--block">
          Start session
        </button>
      </main>
    </div>
  )
}
