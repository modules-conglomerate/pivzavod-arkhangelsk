import { useEffect, useState } from 'react'

/** Текущее время, обновляемое раз в interval мс. null — без обновлений. */
export function useNow(interval: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (interval === null) return
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}
