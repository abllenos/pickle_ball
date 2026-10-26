import { changeTheme, resolveTheme } from '../../lib/theme'
import { useDeviceSettings } from '../../store/deviceSettings'
import { Icon } from '../Icon'
import './ThemeButton.css'

export function ThemeButton() {
  const theme = useDeviceSettings((s) => s.theme)
  const dark = resolveTheme(theme) === 'dark'

  return (
    <button
      type="button"
      className="theme-btn"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        changeTheme(dark ? 'light' : 'dark', { x: box.left + box.width / 2, y: box.top + box.height / 2 })
      }}
    >
      <span key={dark ? 'sun' : 'moon'} className="theme-btn__icon">
        <Icon name={dark ? 'sun' : 'moon'} size={20} />
      </span>
    </button>
  )
}
