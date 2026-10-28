import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/PageHeader/PageHeader'
import { Select } from '../../../components/Select/Select'
import { queueOrder } from '../../../core/matching'
import { respellName } from '../../../core/pronounce'
import { useAnnouncer } from '../../../store/announcerStore'
import { shortNames, useSession, waitingPlayers } from '../../../store/sessionStore'
import { SKILL_LEVELS, SKILL_NAMES, type Player, type SkillLevel } from '../../../types/models'
import './PlayersPage.css'

function gamesLabel(n: number) {
  return n === 1 ? '1 game' : `${n} games`
}

export default function PlayersPage() {
  const session = useSession()
  const { players, courts, results, addPlayer, removePlayer, setResting, setSayAs } = session
  const previewName = useAnnouncer((s) => s.previewName)
  const [name, setName] = useState('')
  const [skill, setSkill] = useState<SkillLevel>(3.0)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [sayEdit, setSayEdit] = useState<{ id: string; draft: string } | null>(null)
  const names = shortNames(players)

  const courtOf = new Map<string, number>()
  courts.forEach((c, i) => c.players?.forEach((id) => courtOf.set(id, i)))
  const queuePos = new Map(queueOrder(waitingPlayers(session)).map((p, i) => [p.id, i + 1]))
  const played = (p: Player) => p.games + (courtOf.has(p.id) ? 1 : 0)

  const active = players.filter((p) => p.status === 'active')
  const resting = players.filter((p) => p.status === 'resting')
  const counts = active.map(played)
  const min = counts.length ? Math.min(...counts) : 0
  const max = counts.length ? Math.max(...counts) : 0
  const sorted = [...active].sort((a, b) => played(a) - played(b) || a.name.localeCompare(b.name))
  const notStarted = results.length === 0 && courts.every((c) => !c.players)

  const status = (p: Player) => {
    const court = courtOf.get(p.id)
    if (court !== undefined) return <span className="chip">Court {court + 1}</span>
    return <span className="chip chip--highlight">#{queuePos.get(p.id)} in line</span>
  }

  return (
    <>
      <PageHeader
        title="Players"
        action={
          <span className="sub players__count">
            {active.length} in · {resting.length} resting
          </span>
        }
      />

      <form
        className="players__add"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (!trimmed) return
          addPlayer(trimmed, skill)
          setName('')
        }}
      >
        <label htmlFor="add-name" className="visually-hidden">
          Player name
        </label>
        <input
          id="add-name"
          className="input players__input"
          placeholder="Player name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <Select
          label="Skill level"
          value={skill}
          onChange={setSkill}
          options={SKILL_LEVELS.map((level) => ({ value: level, label: SKILL_NAMES[level] }))}
        />
        <button type="submit" className="players__add-btn">
          Add
        </button>
      </form>
      <p className="players__note">Late arrivals start level with whoever has played least, so nobody gets pushed off.</p>

      {notStarted && (
        <section className="card players__start">
          {active.length < 4 ? (
            <span className="muted">
              {active.length === 0
                ? 'No players yet. Add each player as they arrive at the desk.'
                : `${active.length} of 4 players needed for the first game.`}
            </span>
          ) : (
            <>
              <span>
                <b>{active.length} players ready.</b> Add more any time.
              </span>
              <Link to="/organizer" className="btn btn--primary btn--block">
                Start games on Courts
              </Link>
            </>
          )}
        </section>
      )}

      {active.length > 0 && (
        <section className={max - min <= 1 ? 'players__fair' : 'players__fair players__fair--off'}>
          <b>{min === max ? `Everyone is on ${gamesLabel(min)}` : `Games played: ${min}–${max}`}</b>
          <span>
            {max - min <= 1
              ? 'Fair: nobody is more than one game behind.'
              : 'Someone is behind. They play first until they catch up.'}
          </span>
        </section>
      )}

      <ul className="list-card" hidden={active.length === 0}>
        {sorted.map((p) => {
          const onCourt = courtOf.has(p.id)
          return (
            <li key={p.id} className="players__row">
              <span className="players__who">
                <b>{p.name}</b> {status(p)}
                <br />
                <span className="sub">
                  {SKILL_NAMES[p.skill]} · {gamesLabel(played(p))} · {p.wins} wins
                </span>
              </span>
              <span className="players__buttons">
                <button
                  type="button"
                  className="btn btn--small players__say"
                  aria-label={`How to say ${p.name}`}
                  aria-expanded={sayEdit?.id === p.id}
                  onClick={() => setSayEdit(sayEdit?.id === p.id ? null : { id: p.id, draft: p.sayAs ?? '' })}
                >
                  🔊
                </button>
                <button
                  type="button"
                  className="btn btn--small"
                  disabled={onCourt}
                  title={onCourt ? 'Can rest after this game' : undefined}
                  onClick={() => setResting(p.id, true)}
                >
                  Rest
                </button>
                {confirmRemove === p.id ? (
                  <button
                    type="button"
                    className="btn btn--small players__remove players__remove--confirm"
                    onClick={() => {
                      removePlayer(p.id)
                      setConfirmRemove(null)
                    }}
                  >
                    Sure?
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small players__remove"
                    aria-label={`Remove ${p.name}`}
                    disabled={onCourt}
                    onClick={() => setConfirmRemove(p.id)}
                  >
                    ✕
                  </button>
                )}
              </span>
              {sayEdit?.id === p.id && (
                <form
                  className="players__say-edit"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setSayAs(p.id, sayEdit.draft)
                    setSayEdit(null)
                  }}
                >
                  <label htmlFor={`say-${p.id}`} className="sub">
                    Sounds like (spell it the way it should be said)
                  </label>
                  <input
                    id={`say-${p.id}`}
                    className="input players__say-input"
                    placeholder={respellName(names.get(p.id) ?? p.name)}
                    value={sayEdit.draft}
                    onChange={(event) => setSayEdit({ id: p.id, draft: event.target.value })}
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => previewName(names.get(p.id) ?? p.name, sayEdit.draft)}
                  >
                    Hear it
                  </button>
                  <button type="submit" className="btn btn--primary btn--small">
                    Save
                  </button>
                </form>
              )}
            </li>
          )
        })}
      </ul>

      {resting.length > 0 && (
        <>
          <div className="section-label">Resting · {resting.length}</div>
          {resting.map((p) => (
            <div key={p.id} className="players__resting">
              <span className="players__who muted">
                <b className="players__resting-name">{p.name}</b>
                <br />
                <span className="sub">
                  {SKILL_NAMES[p.skill]} · {gamesLabel(p.games)} · on a break
                </span>
              </span>
              <button type="button" className="btn btn--primary btn--small" onClick={() => setResting(p.id, false)}>
                Back in
              </button>
            </div>
          ))}
        </>
      )}
    </>
  )
}
