import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LaunchGate } from '../components/LaunchGate'
import { Soon } from '../pages/Soon'

const auth = vi.hoisted(() => ({ user: null as null | { role: string } }))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: auth.user, loading: false }) }))

const app = (path: string) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route element={<LaunchGate />}>
        <Route path="/" element={<p>Главная сайта</p>} />
        <Route path="/login" element={<p>Страница входа</p>} />
      </Route>
    </Routes>
  </MemoryRouter>
)

describe('заставка', () => {
  it('показывает таймер, форму и преимущества', () => {
    render(<MemoryRouter><Soon at={Date.now() + 90_000_000} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /скоро открытие/i })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('день')
    expect(screen.getByLabelText('Почта или телефон')).toBeInTheDocument()
    expect(screen.getByText('Ракурсы')).toBeInTheDocument()
    expect(screen.queryByText(/экскурс/i)).not.toBeInTheDocument()
  })
  it('без даты вместо таймера — анонс', () => {
    render(<MemoryRouter><Soon at={null} /></MemoryRouter>)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByText(/объявим совсем скоро/i)).toBeInTheDocument()
  })
})

describe('шлюз открытия', () => {
  afterEach(() => { vi.unstubAllEnvs(); auth.user = null })

  it('до открытия гость видит заставку, но вход доступен', () => {
    vi.stubEnv('VITE_COMING_SOON', '1')
    const { unmount } = render(app('/'))
    expect(screen.queryByText('Главная сайта')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /скоро открытие/i })).toBeInTheDocument()
    unmount()
    render(app('/login'))
    expect(screen.getByText('Страница входа')).toBeInTheDocument()
  })
  it('сотрудник видит сайт с плашкой', () => {
    vi.stubEnv('VITE_COMING_SOON', '1')
    auth.user = { role: 'manager' }
    render(app('/'))
    expect(screen.getByText('Главная сайта')).toBeInTheDocument()
    expect(screen.getByText(/закрыт для гостей/i)).toBeInTheDocument()
  })
  it('после даты открытия заставки нет', () => {
    vi.stubEnv('VITE_LAUNCH_AT', '2020-01-01T00:00:00Z')
    render(app('/'))
    expect(screen.getByText('Главная сайта')).toBeInTheDocument()
  })
})
