import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageHead } from '../components/blocks'
import { can, isStaff, type Permission } from '../lib/roles'
import { useAuth } from './AuthContext'

interface Props {
  /** true: нужна завершённая регистрация (телефон, согласие). */
  registered?: boolean
  /** Нужна любая рабочая роль. */
  staff?: boolean
  /** Нужно хотя бы одно из прав. */
  perm?: Permission[]
}

export function RequireAuth({ registered = true, staff = false, perm }: Props) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p className="wrap py-20">Загрузка…</p>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  if (registered && !user.registered_at) return <Navigate to="/register" replace />
  if ((staff && !isStaff(user.role)) || (perm && !perm.some((p) => can(user.role, p)))) {
    return <PageHead title="Нет доступа" lead="Этот раздел доступен сотрудникам с другой ролью." />
  }
  return <Outlet />
}
