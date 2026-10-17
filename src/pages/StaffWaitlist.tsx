import { useResource } from '../lib/useResource'
import type { WaitlistEntry } from '../types'

export function StaffWaitlist() {
  const { data, error } = useResource<{ entries: WaitlistEntry[] }>('/api/staff/waitlist')
  const all = data?.entries ?? []
  return (
    <>
      <p className="err" role="alert">{error}</p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <b className="font-serif text-2xl">{all.length}</b> <span>ждут открытия</span>
        {all.length > 0 && <button className="btn-dark" onClick={() => void navigator.clipboard.writeText(all.map((e) => e.contact).join('\n'))}>Копировать все контакты</button>}
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {all.map((e) => (
          <li key={e.contact} className="border border-burgundy/20 bg-ivory px-4 py-2 text-sm">
            {e.contact} <span className="text-charcoal/60">· {e.kind === 'email' ? 'почта' : 'телефон'} · {new Date(e.created_at).toLocaleDateString('ru-RU')}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
