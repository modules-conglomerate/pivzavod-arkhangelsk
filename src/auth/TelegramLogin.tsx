import { useEffect, useRef } from 'react'

/** Официальный Telegram Login Widget. После входа Telegram переводит браузер на /api/auth/telegram. */
export function TelegramLogin() {
  const ref = useRef<HTMLDivElement>(null)
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    const el = ref.current
    if (!el || !bot) return
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.setAttribute('data-telegram-login', bot)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-auth-url', '/api/auth/telegram')
    s.setAttribute('data-request-access', 'write')
    el.appendChild(s)
    return () => { el.innerHTML = '' }
  }, [bot])

  if (!bot) return <p className="text-sm text-brick">Не задана переменная VITE_TELEGRAM_BOT_USERNAME.</p>
  return <div ref={ref} />
}
