import { can, isStaff, rank } from '../lib/roles'

describe('матрица прав', () => {
  it('гость не видит кабинет', () => {
    expect(isStaff('customer')).toBe(false)
    expect(can('customer', 'bookings:view_all')).toBe(false)
  })
  it('сомелье работает с заметками и своими заявками, но не с пользователями', () => {
    expect(can('sommelier', 'beers:notes')).toBe(true)
    expect(can('sommelier', 'bookings:claim')).toBe(true)
    expect(can('sommelier', 'beers:manage')).toBe(false)
    expect(can('sommelier', 'users:view')).toBe(false)
  })
  it('менеджер видит пользователей, но не меняет роли', () => {
    expect(can('manager', 'users:view')).toBe(true)
    expect(can('manager', 'users:manage')).toBe(false)
    expect(can('manager', 'invites:manage')).toBe(false)
  })
  it('только администратор выдаёт роли', () => {
    expect(can('admin', 'users:manage')).toBe(true)
    expect(can('admin', 'applications:review')).toBe(true)
    expect(can(null, 'users:manage')).toBe(false)
  })
  it('роли упорядочены по рангу', () => {
    expect(rank('admin')).toBeGreaterThan(rank('manager'))
    expect(rank('manager')).toBeGreaterThan(rank('sommelier'))
  })
})

describe('права на ракурсы', () => {
  it('ракурсы создают менеджер и админ, отмечают посещения ещё и сомелье', () => {
    expect(can('manager', 'rakurs:manage')).toBe(true)
    expect(can('sommelier', 'rakurs:manage')).toBe(false)
    expect(can('sommelier', 'rakurs:attend')).toBe(true)
    expect(can('customer', 'rakurs:attend')).toBe(false)
  })
})
