import { useSite } from '../context/SiteContext'
import { MinusIcon, PlusIcon } from './Icons'

export default function QtyStepper({ value, onChange, min = 1, label = 'Quantity', size }) {
  const { MAX_QTY } = useSite()
  return (
    <div className={`qty${size === 'sm' ? ' qty--sm' : ''}`} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  )
}
