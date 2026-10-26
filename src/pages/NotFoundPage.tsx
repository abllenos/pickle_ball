import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader/PageHeader'

export default function NotFoundPage() {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <PageHeader title="Page not found" />
        <Link to="/" className="btn btn--primary btn--block">
          Go home
        </Link>
      </main>
    </div>
  )
}
