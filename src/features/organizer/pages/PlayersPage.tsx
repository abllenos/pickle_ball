import { useState } from 'react'
import { PageHeader } from '../../../components/PageHeader/PageHeader'
import { queueOrder } from '../../../core/matching'
import { useSession, waitingPlayers } from '../../../store/sessionStore'
import { SKILL_LEVELS, type Player, type SkillLevel } from '../../../types/models'
import './PlayersPage.css'

function gamesLabel(n: number) {
  return n === 1 ? '1 game' : `${n} games`
}

export default function PlayersPage() {
  const session = useSession()
  const { players, courts, addPlayer, removePlayer, setResting } = session
  const [name, setName] = useState('')
  const [skill, setSkill] = useState<SkillLevel>(3.0)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

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
          placeholder="Add a player"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <label htmlFor="add-skill" className="visually-hidden">
          Skill level
        </label>
        <select
          id="add-skill"
          className="input players__input players__select"
          value={skill}
          onChange={(event) => setSkill(Number(event.target.value) as SkillLevel)}
        >
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.toFixed(1)}
            </option>
          ))}
        </select>
        <button type="submit" className="players__add-btn">
          Add
        </button>
      </form>
      <p className="players__note">Late arrivals start level with whoever has played least, so nobody gets pushed off.</p>

      <section className={max - min <= 1 ? 'players__fair' : 'players__fair players__fair--off'}>
        <b>{min === max ? `Everyone is on ${gamesLabel(min)}` : `Games played: ${min}–${max}`}</b>
        <span>
          {max - min <= 1
            ? 'Fair: nobody is more than one game behind.'
            : 'Someone is behind. They play first until they catch up.'}
        </span>
      </section>

      <ul className="list-card">
        {sorted.map((p) => {
          const onCourt = courtOf.has(p.id)
          return (
            <li key={p.id} className="players__row">
              <span className="players__who">
                <b>{p.name}</b> {status(p)}
                <br />
                <span className="sub">
                  {p.skill.toFixed(1)} · {gamesLabel(played(p))} · {p.wins} wins
                </span>
              </span>
              <span className="players__buttons">
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
                  {p.skill.toFixed(1)} · {gamesLabel(p.games)} · on a break
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
