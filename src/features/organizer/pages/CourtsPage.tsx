import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { PageHeader } from '../../../components/PageHeader/PageHeader'
import { formatClock, formatLeft, useNow } from '../../../lib/time'
import { newGamesAllowed, shortNames, upNext, useSession, waitingPlayers } from '../../../store/sessionStore'
import './CourtsPage.css'

const LONG_GAME_MS = 20 * 60_000

export default function CourtsPage() {
  const session = useSession()
  const { name, players, courts, results, scoreLimit, rentalEndsAt, lastCallMinutes } = session
  const { finishGame, fillCourt, holdCourt, callAgain, addCourt } = session
  const now = useNow()
  const [askNoResult, setAskNoResult] = useState<number | null>(null)

  const names = shortNames(players)
  const short = (id: string) => names.get(id) ?? '—'
  const waiting = waitingPlayers(session)
  const next = upNext(session)
  const openCourts = courts.map((c, i) => (c.players ? -1 : i)).filter((i) => i >= 0)
  const rentalLeft = rentalEndsAt - now
  const gamesAllowed = newGamesAllowed(session, now)

  const fillAll = () => {
    for (const i of openCourts) useSession.getState().fillCourt(i)
  }

  return (
    <>
      <PageHeader
        eyebrow={name}
        title="Courts"
        action={
          <button type="button" className="btn btn--accent" onClick={addCourt}>
            <Icon name="plus" size={18} strokeWidth={2.4} />
            Add court
          </button>
        }
      />

      <div className="chip-row">
        <span className={rentalLeft < 15 * 60_000 ? 'chip chip--warning' : 'chip'}>
          {rentalLeft > 0 ? `Rental: ${formatLeft(rentalLeft)} left` : 'Rental ended'}
        </span>
        {!gamesAllowed && rentalLeft > 0 && <span className="chip chip--warning">No new games</span>}
        <span className="chip">Games to {scoreLimit}</span>
        <span className="chip">{waiting.length} waiting</span>
      </div>

      {!next && openCourts.length === courts.length && (
        <Link to="/organizer/players" className="card courts__need">
          <b>Add at least 4 players to start</b>
          <span className="sub">
            {players.length === 0 ? 'No players yet.' : `${waiting.length} ready so far.`} Tap here to add players.
          </span>
        </Link>
      )}

      {openCourts.length > 1 && next && gamesAllowed && courts.every((c) => !c.fillAt) && (
        <button type="button" className="btn btn--primary btn--block" onClick={fillAll}>
          Fill {openCourts.length} open courts & announce
        </button>
      )}

      {courts.map((court, i) => {
        if (!court.players || !court.startedAt) {
          const lastHere = results.find((r) => r.court === i + 1)
          const justWon = lastHere?.winner && court.fillAt ? lastHere : undefined
          const countdown = court.fillAt ? Math.max(0, Math.ceil((court.fillAt - now) / 1000)) : null
          return (
            <article key={i} className="courts__open">
              <div className="courts__head">
                <h2 className="courts__name">Court {i + 1}</h2>
                <span className="courts__open-label">{justWon ? 'Game over' : 'Open'}</span>
              </div>
              {justWon && (
                <span className="courts__won">
                  🏆 Team {justWon.winner}:{' '}
                  {justWon.winner === 'A'
                    ? `${short(justWon.players[0])} & ${short(justWon.players[1])}`
                    : `${short(justWon.players[2])} & ${short(justWon.players[3])}`}
                </span>
              )}
              {countdown !== null ? (
                <>
                  <span className="courts__countdown">
                    {next ? `Next four called in ${countdown} s` : 'Next four called when 4 players are free'}
                  </span>
                  <div className="courts__actions">
                    <button type="button" className="courts__fill" disabled={!next} onClick={() => fillCourt(i)}>
                      Send now
                    </button>
                    <button type="button" className="courts__hold" onClick={() => holdCourt(i)}>
                      Hold
                    </button>
                  </div>
                </>
              ) : !gamesAllowed ? (
                <>
                  <span className="courts__countdown">
                    Last {lastCallMinutes} min of the rental: no new games.
                  </span>
                  {next && (
                    <button type="button" className="courts__hold" onClick={() => fillCourt(i)}>
                      Start a game anyway
                    </button>
                  )}
                </>
              ) : next ? (
                <button type="button" className="courts__fill" onClick={() => fillCourt(i)}>
                  Send next four & announce
                </button>
              ) : (
                <span className="sub">Waiting for 4 free players.</span>
              )}
            </article>
          )
        }

        const four = court.players
        const elapsed = now - court.startedAt
        const long = elapsed > LONG_GAME_MS
        return (
          <article key={i} className="courts__card">
            <div className="courts__head">
              <h2 className="courts__name">Court {i + 1}</h2>
              {long ? (
                <span className="chip chip--warning">{formatClock(elapsed)} · long game</span>
              ) : (
                <span className="courts__timer">{formatClock(elapsed)}</span>
              )}
            </div>
            <div className="courts__teams">
              <span className="courts__team">
                <span>{short(four[0])}</span>
                <span>{short(four[1])}</span>
              </span>
              <span className="courts__vs">vs</span>
              <span className="courts__team courts__team--right">
                <span>{short(four[2])}</span>
                <span>{short(four[3])}</span>
              </span>
            </div>
            <span className="section-label">Who reached {scoreLimit}?</span>
            <div className="courts__actions">
              <button type="button" className="courts__btn courts__btn--team" onClick={() => finishGame(i, 'A')}>
                Team A won
              </button>
              <button type="button" className="courts__btn courts__btn--team" onClick={() => finishGame(i, 'B')}>
                Team B won
              </button>
            </div>
            <div className="courts__minor">
              <button type="button" className="courts__link" onClick={() => callAgain(i)}>
                Call again
              </button>
              {askNoResult === i ? (
                <button
                  type="button"
                  className="courts__link courts__link--warn"
                  onClick={() => {
                    finishGame(i, null)
                    setAskNoResult(null)
                  }}
                >
                  Tap again to end with no result
                </button>
              ) : (
                <button type="button" className="courts__link" onClick={() => setAskNoResult(i)}>
                  End without result
                </button>
              )}
            </div>
          </article>
        )
      })}

      {next && openCourts.length === 0 && (
        <Link to="/organizer/up-next" className="courts__up-next">
          <span className="courts__dot" aria-hidden="true" />
          <span className="courts__up-next-text">
            <span className="courts__up-next-label">Up next · first court to finish</span>
            <span className="courts__up-next-names">
              {short(next[0])}, {short(next[1])} vs {short(next[2])}, {short(next[3])}
            </span>
          </span>
          <span className="courts__review">Edit</span>
        </Link>
      )}

      {results.length > 0 && (
        <section className="card courts__results">
          <h2 className="courts__results-title">Just finished</h2>
          <ul className="courts__results-list">
            {results.slice(0, 3).map((r) => {
              const [a1, a2, b1, b2] = r.players
              const w = r.winner === 'A' ? [a1, a2] : [b1, b2]
              const l = r.winner === 'A' ? [b1, b2] : [a1, a2]
              return (
                <li key={r.endedAt} className="courts__result-row">
                  <span>
                    Court {r.court} ·{' '}
                    {r.winner ? (
                      <>
                        <b>
                          {short(w[0])} & {short(w[1])}
                        </b>{' '}
                        beat {short(l[0])} & {short(l[1])}
                      </>
                    ) : (
                      'no result'
                    )}
                  </span>
                  <span className="sub">{Math.round((r.endedAt - r.startedAt) / 60_000)} min</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
