import { Link } from 'react-router'
import usePageTitle from '../components/usePageTitle'
import { ArrowRightIcon } from '../components/Icons'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="empty-state empty-state--page">
      <div className="container">
        <p className="eyebrow eyebrow--center">404</p>
        <h1 className="page-title">
          This soap has <em>slipped away.</em>
        </h1>
        <p className="page-lede">The page you were looking for doesn&apos;t exist anymore.</p>
        <div className="empty-actions">
          <Link className="btn btn--primary" to="/shop">
            Visit the shop <ArrowRightIcon />
          </Link>
          <Link className="btn btn--ghost" to="/">
            Back home
          </Link>
        </div>
      </div>
    </section>
  )
}
