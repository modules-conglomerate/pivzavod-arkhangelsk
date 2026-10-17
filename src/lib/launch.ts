export interface LaunchState { active: boolean; at: number | null }
interface LaunchEnv { VITE_LAUNCH_AT?: string; VITE_COMING_SOON?: string }

/**
 * Режим заставки.
 * VITE_LAUNCH_AT (ISO-дата) — заставка с таймером до этого момента, потом сайт открывается сам.
 * VITE_COMING_SOON=1 — заставка без даты. Ничего не задано — сайт открыт.
 */
export function getLaunch(env: LaunchEnv, now = Date.now()): LaunchState {
  const at = env.VITE_LAUNCH_AT ? Date.parse(env.VITE_LAUNCH_AT) : NaN
  if (Number.isFinite(at)) return { active: now < at, at }
  return { active: env.VITE_COMING_SOON === '1', at: null }
}

export function splitDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 }
}

/** Склонение: plural(1, ['день','дня','дней']) → 'день'. */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  return b === 1 ? forms[0] : forms[2]
}
