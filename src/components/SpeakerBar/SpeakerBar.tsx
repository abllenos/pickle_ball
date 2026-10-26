import { Icon } from '../Icon'
import { useAnnouncer } from '../../store/announcerStore'
import './SpeakerBar.css'

export function SpeakerBar() {
  const { current, notice, stop, dismiss } = useAnnouncer()

  if (current) {
    return (
      <div className="speaker-bar" role="status">
        <span className="speaker-bar__icon">
          <Icon name="speakerLoud" size={18} />
        </span>
        <span className="speaker-bar__text">{current}</span>
        <button type="button" className="speaker-bar__btn" onClick={stop}>
          Stop
        </button>
      </div>
    )
  }

  if (notice) {
    return (
      <div className="speaker-bar speaker-bar--notice" role="alert">
        <span className="speaker-bar__text">{notice}</span>
        <button type="button" className="speaker-bar__btn" onClick={dismiss}>
          OK
        </button>
      </div>
    )
  }

  return null
}
