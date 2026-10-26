import { useEffect } from 'react'
import { newGamesAllowed, useSession } from '../../store/sessionStore'

export function AutoFill() {
  const courts = useSession((s) => s.courts)
  const players = useSession((s) => s.players)

  useEffect(() => {
    const pending = courts.filter((c) => !c.players && c.fillAt !== null)
    if (pending.length === 0) return

    const run = () => {
      const s = useSession.getState()
      const now = Date.now()
      s.courts.forEach((c, i) => {
        if (c.players || c.fillAt === null || c.fillAt > now) return
        if (newGamesAllowed(s, now)) useSession.getState().fillCourt(i)
        else useSession.getState().holdCourt(i)
      })
    }

    const soonest = Math.min(...pending.map((c) => c.fillAt!))
    const id = setTimeout(run, Math.max(0, soonest - Date.now()))
    return () => clearTimeout(id)
  }, [courts, players])

  return null
}
