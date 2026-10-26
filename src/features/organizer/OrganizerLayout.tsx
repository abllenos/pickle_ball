import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav, type NavItem } from '../../components/BottomNav/BottomNav'
import { SpeakerBar } from '../../components/SpeakerBar/SpeakerBar'
import { useSession } from '../../store/sessionStore'
import { AutoFill } from './AutoFill'

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/organizer', label: 'Courts', icon: 'court', end: true },
  { to: '/organizer/players', label: 'Players', icon: 'list' },
  { to: '/organizer/up-next', label: 'Up Next', icon: 'speaker' },
  { to: '/organizer/session', label: 'Session', icon: 'calendar' },
]

export default function OrganizerLayout() {
  const status = useSession((s) => s.status)
  const { pathname } = useLocation()
  const index = navItems.findIndex((item) => item.to === pathname)
  const [tab, setTab] = useState({ index, dir: 'up' })
  if (tab.index !== index) setTab({ index, dir: index > tab.index ? 'forward' : 'back' })

  if (status === 'none') return <Navigate to="/" replace />

  return (
    <div className="app-shell">
      <AutoFill />
      <SpeakerBar />
      <main key={pathname} className="app-shell__content page" data-dir={tab.dir}>
        <Outlet />
      </main>
      <BottomNav label="Organizer" items={navItems} />
    </div>
  )
}
