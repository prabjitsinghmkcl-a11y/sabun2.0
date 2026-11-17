import { Link } from 'react-router'
import { CheckIcon } from './Icons'

const steps = [
  { label: 'Cart', to: '/cart' },
  { label: 'Delivery details', to: '/checkout' },
  { label: 'Send on WhatsApp' },
]

export default function CheckoutSteps({ current }) {
  return (
    <ol className="co-steps" aria-label="Checkout progress">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        const content = (
          <>
            <span className="co-dot">{state === 'done' ? <CheckIcon /> : i + 1}</span>
            <span className="co-label">{step.label}</span>
          </>
        )
        return (
          <li key={step.label} className={`co-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            {state === 'done' && step.to ? <Link to={step.to}>{content}</Link> : content}
          </li>
        )
      })}
    </ol>
  )
}
