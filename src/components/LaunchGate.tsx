import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getLaunch } from '../lib/launch'
import { isStaff } from '../lib/roles'
import { useNow } from '../lib/useNow'
import { Soon } from '../pages/Soon'

// Эти разделы нужны до открытия: вход, регистрация и кабинет персонала.
const OPEN = ['/login', '/invite', '/register', '/staff', '/account', '/apply']

/**
 * До открытия показывает гостям заставку, сотрудникам — настоящий сайт с плашкой.
 * Это витринное скрытие в браузере, а не защита данных: API остаётся доступным.
 */
export function LaunchGate() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const configured = Boolean(import.meta.env.VITE_LAUNCH_AT)
  const now = useNow(configured ? 1000 : null)
  const launch = getLaunch(import.meta.env, now)
  if (!launch.active || OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <Outlet />
  if (!isStaff(user?.role)) return <Soon at={launch.at} />
  return (
    <>
      <p className="bg-gold px-4 py-1.5 text-center text-xs text-burgundy">
        Сайт пока закрыт для гостей, вы видите его как сотрудник. <Link to="/soon" className="font-semibold underline">Посмотреть заставку</Link>
      </p>
      <Outlet />
    </>
  )
}
