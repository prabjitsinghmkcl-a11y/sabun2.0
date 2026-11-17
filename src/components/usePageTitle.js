import { useEffect } from 'react'

const BASE = 'SaBun'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — Handcrafted Soap, Made in Small Batches`
  }, [title])
}
