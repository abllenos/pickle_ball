import { startCast, stopCast, useCast } from '../../lib/cast'
import { Icon } from '../Icon'
import './CastButton.css'

/** Cast the TV dashboard to a Chromecast / Google TV. Renders nothing where casting isn't supported. */
export function CastButton() {
  const { supported, available, status } = useCast()
  if (!supported) return null

  if (status === 'connected') {
    return (
      <button type="button" className="btn btn--secondary btn--block cast-btn cast-btn--on" onClick={stopCast}>
        <span className="cast-btn__dot" aria-hidden="true" />
        Casting to TV
        <span className="cast-btn__stop">Stop</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="btn btn--secondary btn--block cast-btn"
      disabled={status === 'connecting'}
      onClick={() => void startCast()}
    >
      <Icon name="cast" size={20} />
      {status === 'connecting' ? 'Connecting…' : available ? 'Cast to TV' : 'Cast to TV (no TV found yet)'}
    </button>
  )
}
