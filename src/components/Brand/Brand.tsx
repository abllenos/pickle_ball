import { Icon } from '../Icon'
import './Brand.css'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand__mark">
        <Icon name="court" size={20} />
      </span>
      <span className="brand__name">Open Play</span>
    </div>
  )
}
