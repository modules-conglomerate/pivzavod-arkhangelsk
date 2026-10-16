import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Beer } from '../pages/Content'

it('фильтрует сорта по семейству', async () => {
  render(<MemoryRouter><Beer /></MemoryRouter>)
  expect(screen.getByText('Северное')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Тёмные' }))
  expect(screen.getByText('Беломорский')).toBeInTheDocument()
  expect(screen.queryByText('Северное')).not.toBeInTheDocument()
})
