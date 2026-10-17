import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Award, Briefcase, Menu, Phone, User, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { contacts, nav } from '../content/site'
import { isStaff } from '../lib/roles'

function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) =>
    `text-xs uppercase tracking-widest hover:text-gold ${isActive ? 'text-gold' : ''}`
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-burgundy text-ivory">
      <div className="wrap flex h-16 items-center gap-6">
        <Link to="/" className="font-serif text-xl font-semibold tracking-[0.14em]">ПИВЗАВОД</Link>
        <nav aria-label="Основная навигация" className="ml-4 hidden gap-5 lg:flex">
          {nav.map((n) => <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>)}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className="hidden items-center gap-2 text-xs xl:flex"><Phone size={14} />{contacts.phone}</a>
          {user && <Link to="/passport" className="hidden items-center gap-1 text-xs hover:text-gold sm:flex"><Award size={16} />Паспорт</Link>}
          {user && isStaff(user.role) && <Link to="/staff" className="flex items-center gap-1 text-xs text-gold"><Briefcase size={16} />Кабинет</Link>}
          <Link to={user ? '/account' : '/login'} className="flex items-center gap-1 text-xs hover:text-gold"><User size={16} />{user ? user.first_name : 'Войти'}</Link>
          <Link to="/booking" className="btn-gold hidden sm:inline-flex">Забронировать</Link>
          <button className="lg:hidden" aria-label="Меню" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav aria-label="Мобильная навигация" className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 lg:hidden" onClick={() => setOpen(false)}>
          {nav.map((n) => <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>)}
          <Link to="/booking" className="btn-gold">Забронировать</Link>
        </nav>
      )}
    </header>
  )
}

export function Layout() {
  const { user } = useAuth()
  const go = useNavigate()
  // Приглашение, открытое до входа в Telegram: после возврата продолжаем активацию.
  useEffect(() => {
    const code = sessionStorage.getItem('pz_invite')
    if (user && code) go(`/invite/${code}`, { replace: true })
  }, [user, go])
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <footer className="bg-burgundy py-8 text-sm text-ivory">
        <div className="wrap flex flex-wrap justify-between gap-3">
          <span>ПИВЗАВОД — пивной ресторан и креативный кластер</span>
          <span>{contacts.address} · с 1898 года</span>
        </div>
      </footer>
    </>
  )
}
