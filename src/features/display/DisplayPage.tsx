import { Icon } from '../../components/Icon'
import { queueOrder } from '../../core/matching'
import { rankPlayers } from '../../core/standings'
import { formatClock, formatLeft, useNow, wallClock } from '../../lib/time'
import { newGamesAllowed, shortNames, upNext, useSession, waitingPlayers, WINNER_SHOW_MS } from '../../store/sessionStore'
import './DisplayPage.css'

const TOP_COUNT = 5

export default function DisplayPage() {
  const session = useSession()
  const { name, venue, players, courts, results, scoreLimit, rentalEndsAt } = session
  const now = useNow()

  const names = shortNames(players)
  const short = (id: string) => names.get(id) ?? '—'
  const clock = wallClock(now)
  const ends = wallClock(rentalEndsAt)
  const rentalLeft = rentalEndsAt - now
  const top = rankPlayers(players).slice(0, TOP_COUNT)
  const next = upNext(session)
  const waiting = queueOrder(waitingPlayers(session))
  const last = results[0]
  const gamesAllowed = newGamesAllowed(session, now)

  return (
    <div className="tv">
      <div className="tv__canvas">
        <header className="tv__header">
          <div className="tv__brand">
            <span className="tv__mark">
              <Icon name="court" size={32} />
            </span>
            <div>
              <h1 className="tv__title">{name}</h1>
              <div className="tv__meta">
                {venue && `${venue} · `}
                {courts.length} courts · games to {scoreLimit}
              </div>
            </div>
          </div>
          <div className="tv__clock-block">
            <div className="tv__clock">
              {clock.time} <span className="tv__meridiem">{clock.meridiem}</span>
            </div>
            <div className={rentalLeft < 15 * 60_000 ? 'tv__rental tv__rental--soon' : 'tv__rental'}>
              {rentalLeft > 0 ? `Courts until ${ends.time} ${ends.meridiem} · ${formatLeft(rentalLeft)} left` : 'Court rental has ended'}
            </div>
          </div>
        </header>

        <main className="tv__courts" data-count={Math.min(courts.length, 6)}>
          {courts.map((court, i) => {
            const justWon = court.players
              ? undefined
              : results.find((r) => r.court === i + 1 && r.winner && now - r.endedAt < WINNER_SHOW_MS + 5_000)
            if (justWon) {
              const [a1, a2, b1, b2] = justWon.players
              const [w1, w2, l1, l2] = justWon.winner === 'A' ? [a1, a2, b1, b2] : [b1, b2, a1, a2]
              return (
                <article key={i} className="tv__court tv__court--winner">
                  <div className="tv__court-head">
                    <h2 className="tv__court-name">Court {i + 1}</h2>
                    <span className="tv__badge">Game over</span>
                  </div>
                  <div className="tv__win">
                    <span className="tv__win-label">
                      <Icon name="trophy" size={34} />
                      Team {justWon.winner} wins!
                    </span>
                    <span className="tv__win-names">
                      {short(w1)} & {short(w2)}
                    </span>
                    <span className="tv__win-beat">
                      beat {short(l1)} & {short(l2)}
                    </span>
                  </div>
                  {court.fillAt && court.fillAt > now && (
                    <div className="tv__win-next">Next players in {Math.ceil((court.fillAt - now) / 1000)} s</div>
                  )}
                </article>
              )
            }
            return court.players && court.startedAt ? (
              <article key={i} className="tv__court">
                <div className="tv__court-head">
                  <h2 className="tv__court-name">Court {i + 1}</h2>
                  <span className="tv__timer">{formatClock(now - court.startedAt)}</span>
                </div>
                <div className="tv__teams">
                  <span>
                    {short(court.players[0])}
                    <br />
                    {short(court.players[1])}
                  </span>
                  <span className="tv__vs">vs</span>
                  <span className="tv__team-right">
                    {short(court.players[2])}
                    <br />
                    {short(court.players[3])}
                  </span>
                </div>
              </article>
            ) : (
              <article key={i} className="tv__court tv__court--open">
                <div className="tv__court-head">
                  <h2 className="tv__court-name">Court {i + 1}</h2>
                  <span className="tv__badge">Open</span>
                </div>
                <div className="tv__open-note">
                  {gamesAllowed ? 'Next players are being called' : 'No new games: the court rental is ending'}
                </div>
              </article>
            )
          })}
        </main>

        <aside className="tv__side">
          <section className="tv__panel tv__next">
            <h2 className="tv__panel-title tv__panel-title--small">Next in line</h2>
            {next ? (
              <div className="tv__next-teams">
                <span>
                  {short(next[0])} & {short(next[1])}
                </span>
                <span className="tv__vs">vs</span>
                <span>
                  {short(next[2])} & {short(next[3])}
                </span>
              </div>
            ) : waiting.length > 0 ? (
              <div className="tv__next-teams">
                <span>{waiting.map((p) => short(p.id)).join(', ')}</span>
                <span className="tv__next-note">
                  with {4 - waiting.length} from the next game to finish
                </span>
              </div>
            ) : (
              <div className="tv__empty">Everyone is on court</div>
            )}
          </section>

          <section className="tv__panel tv__top">
            <h2 className="tv__panel-title">
              <Icon name="trophy" size={30} />
              Top players
            </h2>
            {top.length === 0 ? (
              <p className="tv__empty">Wins show up after the first games.</p>
            ) : (
              <ol className="tv__top-list">
                {top.map((p, i) => (
                  <li key={p.id} className="tv__top-row">
                    <span className={i === 0 ? 'tv__pos tv__pos--first' : i < 3 ? 'tv__pos tv__pos--podium' : 'tv__pos'}>{i + 1}</span>
                    <span className="tv__top-name">{short(p.id)}</span>
                    <span className="tv__wins">
                      {p.wins}
                      <span className="tv__wins-label">{p.wins === 1 ? 'win' : 'wins'}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>

        <footer className="tv__footer">
          <Icon name="list" size={32} />
          <span>
            <b>Just arrived?</b> Give your name at the desk and listen for the speaker.
          </span>
          {last?.winner && (
            <span className="tv__last">
              Court {last.court} winners:{' '}
              {last.winner === 'A'
                ? `${short(last.players[0])} & ${short(last.players[1])}`
                : `${short(last.players[2])} & ${short(last.players[3])}`}
            </span>
          )}
        </footer>
      </div>
    </div>
  )
}
