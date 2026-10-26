import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand/Brand'
import { formatLeft, useNow } from '../lib/time'
import { useSession } from '../store/sessionStore'
import './HomePage.css'

const steps = [
  { title: 'Set up the session', hint: 'Courts, rental hours and the score to play to.' },
  { title: 'Add players as they arrive', hint: 'Type each name at the desk. Late arrivals are fine.' },
  { title: 'Tap who won', hint: 'The next four are picked fairly and called on the speaker.' },
]

const copyright = <p className="home__copyright">© {new Date().getFullYear()} Alvin Llenos. All Rights Reserved.</p>

export default function HomePage() {
  const session = useSession()
  const { status, name, venue, players, courts, rentalEndsAt, endSession } = session
  const now = useNow()
  const [confirmEnd, setConfirmEnd] = useState(false)

  if (status === 'none') {
    return (
      <div className="app-shell">
        <main className="app-shell__content home page">
          <Brand />
          <div className="home__intro">
            <h1 className="home__title">Run your open play</h1>
            <p className="muted">Courts never sit idle and everyone gets the same playing time.</p>
          </div>

          <ol className="list-card home__steps">
            {steps.map((step, i) => (
              <li key={step.title} className="home__step">
                <span className="home__num">{i + 1}</span>
                <span>
                  <b>{step.title}</b>
                  <br />
                  <span className="sub">{step.hint}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="spacer" />
          <Link to="/organizer/setup" className="btn btn--primary btn--block">
            Start a session
          </Link>
          {copyright}
        </main>
      </div>
    )
  }

  const rentalLeft = rentalEndsAt - now
  const playing = courts.filter((c) => c.players).length

  return (
    <div className="app-shell">
      <main className="app-shell__content home page">
        <Brand />

        <section className="card home__session">
          <span className="section-label">Session in progress</span>
          <h1 className="home__title">{name}</h1>
          {venue && <span className="muted">{venue}</span>}
          <div className="stat-grid">
            <div className="stat">
              <div className="stat__label">Players</div>
              <div className="stat__value">{players.filter((p) => p.status === 'active').length}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Courts playing</div>
              <div className="stat__value">
                {playing}/{courts.length}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">Time left</div>
              <div className="stat__value">{rentalLeft > 0 ? formatLeft(rentalLeft) : 'Ended'}</div>
            </div>
          </div>
        </section>

        <Link to="/organizer" className="btn btn--primary btn--block">
          Continue
        </Link>
        <a href="/display" target="_blank" rel="noreferrer" className="btn btn--secondary btn--block">
          Open TV screen
        </a>
        <p className="footnote">
          The TV screen follows this session in the same browser. Open it in another tab on the device connected to
          the venue TV.
        </p>

        <div className="spacer" />
        <button
          type="button"
          className={confirmEnd ? 'btn btn--secondary btn--block home__end home__end--confirm' : 'btn btn--secondary btn--block home__end'}
          onClick={() => {
            if (!confirmEnd) return setConfirmEnd(true)
            endSession()
            setConfirmEnd(false)
          }}
        >
          {confirmEnd ? 'Tap again to end the session' : 'End session'}
        </button>
        {copyright}
      </main>
    </div>
  )
}
