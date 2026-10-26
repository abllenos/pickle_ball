import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand/Brand'
import './HomePage.css'

const groups = [
  {
    title: 'Organizer app',
    screens: [
      { to: '/organizer/setup', name: 'New session' },
      { to: '/organizer', name: 'Courts' },
      { to: '/organizer/players', name: 'Players' },
      { to: '/organizer/up-next', name: 'Up Next' },
      { to: '/organizer/session', name: 'Session settings' },
    ],
  },
  {
    title: 'Venue display',
    screens: [{ to: '/display', name: 'TV court display' }],
  },
]

export default function HomePage() {
  return (
    <div className="app-shell">
      <main className="app-shell__content home">
        <Brand />
        <div className="home__intro">
          <h1 className="home__title">Design mockup</h1>
          <p className="muted">Every screen uses sample data. Nothing is saved.</p>
        </div>

        {groups.map((group) => (
          <section key={group.title} className="home__group">
            <h2 className="section-label">{group.title}</h2>
            <ul className="list-card">
              {group.screens.map((screen) => (
                <li key={screen.to}>
                  <Link to={screen.to} className="home__link">
                    {screen.name}
                    <span className="home__path">{screen.to}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  )
}
