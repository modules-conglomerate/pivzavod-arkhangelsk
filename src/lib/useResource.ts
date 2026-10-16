import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

/** Загрузка данных с API. path = null — не загружать. */
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    if (!path) return
    try {
      setData(await api<T>(path))
      setError('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные')
    }
  }, [path])
  useEffect(() => { void reload() }, [reload])
  return { data, error, reload }
}

export async function send(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<void> {
  await api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
}
