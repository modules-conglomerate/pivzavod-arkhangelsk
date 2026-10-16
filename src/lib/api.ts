export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(r.status, body.error ?? 'Что-то пошло не так. Попробуйте ещё раз.')
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T)
}
