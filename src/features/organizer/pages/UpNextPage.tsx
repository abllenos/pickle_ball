import { useState } from 'react'
import { Icon } from '../../../components/Icon'
import { PageHeader } from '../../../components/PageHeader/PageHeader'
import { Segmented } from '../../../components/Segmented'
import { announcementLines } from '../../../core/announcer'
import { queueOrder } from '../../../core/matching'
import { formatClock, formatLeft, useNow } from '../../../lib/time'
import { useDeviceSettings } from '../../../store/deviceSettings'
import { shortNames, typicalGameMs, upNext, useSession, waitingPlayers } from '../../../store/sessionStore'
import { SKILL_NAMES, type MatchingMode } from '../../../types/models'
import './UpNextPage.css'

const MODE_HINT: Record<MatchingMode, string> = {
  same: 'Players close in skill play together. Good for competitive games.',
  balanced: 'Mixed levels, split so both teams add up the same.',
}

export default function UpNextPage() {
  const session = useSession()
  const { players, courts, mode, autoFill, rentalEndsAt, results, setMode, setAutoFill, anotherOption, setNextSlot, fillCourt } =
    session
  const language = useDeviceSettings((s) => s.language)
  const now = useNow()
  const [slot, setSlot] = useState<number | null>(null)

  const byId = new Map(players.map((p) => [p.id, p]))
  const names = shortNames(players)
  const short = (id: string) => names.get(id) ?? '—'
  const next = upNext(session)
  const queue = queueOrder(waitingPlayers(session))
  const openCourt = courts.findIndex((c) => !c.players)
  const rentalLeft = rentalEndsAt - now
  const typical = typicalGameMs(results)

  const renderSlot = (index: number) => {
    const p = next ? byId.get(next[index]) : undefined
    return (
      <button
        key={index}
        type="button"
        className="up-next__slot"
        aria-pressed={slot === index}
        onClick={() => setSlot(slot === index ? null : index)}
      >
        <span className="up-next__slot-name">{p?.name ?? 'Empty spot'}</span>
        {p && (
          <span className="sub">
            {SKILL_NAMES[p.skill]} · {p.games} played
          </span>
        )}
      </button>
    )
  }

  const preview = next
    ? announcementLines(
        {
          kind: 'call',
          court: openCourt >= 0 ? openCourt + 1 : 1,
          teamA: [short(next[0]), short(next[1])],
          teamB: [short(next[2]), short(next[3])],
        },
        language,
      )
    : []

  return (
    <>
      <PageHeader eyebrow="Next game" title="Up Next" />

      {rentalLeft > 0 && rentalLeft < typical && (
        <div className="up-next__rental">
          Only {formatLeft(rentalLeft)} of court rental left. A game takes about {Math.round(typical / 60_000)} min.
        </div>
      )}

      <fieldset className="up-next__mode">
        <legend className="section-label up-next__legend">Match players by</legend>
        <Segmented
          label="Matching mode"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setSlot(null)
          }}
          options={[
            { value: 'same', label: 'Same level' },
            { value: 'balanced', label: 'Balanced' },
          ]}
        />
        <div className="up-next__hint">{MODE_HINT[mode]}</div>
      </fieldset>

      {!next ? (
        <section className="card">
          <p className="muted up-next__empty">Fewer than 4 players are free. The next four appear here when a game ends.</p>
        </section>
      ) : (
        <section className="up-next__match">
          <div className="up-next__team-head">
            <span className="section-label">Team A</span>
            <button type="button" className="up-next__another" onClick={anotherOption}>
              Another option
            </button>
          </div>
          {renderSlot(0)}
          {renderSlot(1)}
          <div className="up-next__vs">
            <span />
            vs
            <span />
          </div>
          <span className="section-label">Team B</span>
          {renderSlot(2)}
          {renderSlot(3)}
          <p className="up-next__tip">
            {slot === null ? 'Tap a spot, then a player below to swap them in.' : 'Now tap a player below (or another spot).'}
          </p>
        </section>
      )}

      <section className="up-next__queue">
        <span className="section-label">Waiting · fewest games first, then longest wait</span>
        <ol className="list-card">
          {queue.map((p, i) => {
            const inNext = next?.includes(p.id)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={inNext ? 'up-next__row up-next__row--next' : 'up-next__row'}
                  disabled={slot === null}
                  onClick={() => {
                    if (slot === null) return
                    setNextSlot(slot, p.id)
                    setSlot(null)
                  }}
                >
                  <span className={inNext ? 'up-next__pos up-next__pos--next' : 'up-next__pos'}>{i + 1}</span>
                  <span className="up-next__who">
                    <b>{p.name}</b>
                    <br />
                    <span className="sub">
                      {SKILL_NAMES[p.skill]} · {p.games} played · waiting {formatClock(now - p.queuedAt)}
                    </span>
                  </span>
                  {inNext && <span className="chip chip--highlight">Up next</span>}
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      {next && (
        <div className="up-next__call">
          <Icon name="speaker" size={20} />
          <span>“{preview.join(' ')}”</span>
        </div>
      )}

      <label htmlFor="auto-fill" className="up-next__auto">
        <span>
          <b>Fill courts automatically</b>
          <br />
          <span className="sub">When a game ends, these four go on that court and get called.</span>
        </span>
        <input
          id="auto-fill"
          type="checkbox"
          role="switch"
          className="switch"
          checked={autoFill}
          onChange={(e) => setAutoFill(e.target.checked)}
        />
      </label>

      <div className="spacer" />
      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={!next || openCourt < 0}
        onClick={() => fillCourt(openCourt)}
      >
        {openCourt >= 0 ? `Send to Court ${openCourt + 1} & announce` : 'Goes to the first court that finishes'}
      </button>
    </>
  )
}
