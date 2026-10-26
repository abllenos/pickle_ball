import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../Icon'
import './BottomNav.css'

export type NavItem = {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

type BottomNavProps = {
  label: string
  items: NavItem[]
}

export function BottomNav({ label, items }: BottomNavProps) {
  return (
    <>
      <div className="bottom-nav__spacer" aria-hidden="true" />
      <nav className="bottom-nav" aria-label={label} data-count={items.length}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'
            }
          >
            <span className="bottom-nav__pill">
              <Icon name={item.icon} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
