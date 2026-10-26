import { Navigate, Outlet } from 'react-router-dom'
import { BottomNav, type NavItem } from '../../components/BottomNav/BottomNav'
import { SpeakerBar } from '../../components/SpeakerBar/SpeakerBar'
import { useSession } from '../../store/sessionStore'
import { AutoFill } from './AutoFill'

const navItems: NavItem[] = [
  { to: '/organizer', label: 'Courts', icon: 'court', end: true },
  { to: '/organizer/players', label: 'Players', icon: 'list' },
  { to: '/organizer/up-next', label: 'Up Next', icon: 'speaker' },
  { to: '/organizer/session', label: 'Session', icon: 'calendar' },
]

export default function OrganizerLayout() {
  const status = useSession((s) => s.status)

  if (status === 'none') return <Navigate to="/" replace />

  return (
    <div className="app-shell">
      <AutoFill />
      <SpeakerBar />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav label="Organizer" items={navItems} />
    </div>
  )
}
