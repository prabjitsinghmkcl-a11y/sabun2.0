const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

export function LeafIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 20C5 11 11 5 21 3c-1 11-7 17-17 17Z" />
      <path d="M4 20c4-6 8-9 13-11" />
    </svg>
  )
}

export function DropIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2.6S5.7 9.4 5.7 14a6.3 6.3 0 0 0 12.6 0c0-4.6-6.3-11.4-6.3-11.4Z" />
    </svg>
  )
}

export function LoopIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.5V9H15" />
    </svg>
  )
}

export function SparkleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 19l1.5-.5.5-1.5Z" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.14-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.45 6.6 2.01 12.05 2.01c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.9-9.88 9.9m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.4Z" />
    </svg>
  )
}

export function ArrowUpRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MenuIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function PromiseIcon({ name }) {
  if (name === 'drop') return <DropIcon />
  if (name === 'loop') return <LoopIcon />
  if (name === 'sparkle') return <SparkleIcon />
  return <LeafIcon />
}

export function MinusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function BagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5.5 8h13l-1 12.5h-11L5.5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function GiftIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8.5h14V12" />
      <path d="M12 8v12.5" />
      <path d="M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8Zm0 0s1.5-4.5 4-3.8c2 .6 1 3.8-4 3.8Z" />
    </svg>
  )
}

export function ArrowLeftIcon() {
  return (
    <svg {...iconProps}>
      <path d="M19.5 12h-15" />
      <path d="m10.5 6-6 6 6 6" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 19.5 5.5 15 15.8 4.7a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L9 18.5l-4.5 1Z" />
      <path d="m14 6.5 3.5 3.5" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}

export function BoxIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  )
}

export function LogoutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4M6 12h10" />
    </svg>
  )
}
