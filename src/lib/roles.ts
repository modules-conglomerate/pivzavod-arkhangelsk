export const roles = ['customer', 'sommelier', 'manager', 'admin'] as const
export type Role = (typeof roles)[number]

export const roleLabels: Record<Role, string> = {
  customer: 'Гость',
  sommelier: 'Пивной сомелье',
  manager: 'Менеджер',
  admin: 'Администратор',
}
/** Роли, на которые можно подать заявку. Администраторов назначают только администраторы/владелец. */
export const applicableRoles = ['sommelier', 'manager'] as const

const matrix = {
  'bookings:view_all': ['manager', 'admin'],
  'bookings:view_assigned': ['sommelier'],
  'bookings:manage': ['manager', 'admin'],
  'bookings:claim': ['sommelier'],
  'beers:notes': ['sommelier', 'manager', 'admin'],
  'beers:manage': ['admin'],
  'users:view': ['manager', 'admin'],
  'users:manage': ['admin'],
  'applications:review': ['admin'],
  'invites:manage': ['admin'],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof matrix

export function can(role: Role | null | undefined, perm: Permission): boolean {
  return !!role && (matrix[perm] as readonly Role[]).includes(role)
}
export const isStaff = (role: Role | null | undefined): boolean => !!role && role !== 'customer'
export const rank = (role: Role): number => roles.indexOf(role)
