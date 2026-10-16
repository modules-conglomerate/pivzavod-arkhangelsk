import type { Role } from './lib/roles'

export interface User {
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
  photo_url: string | null
  full_name: string | null
  phone: string | null
  marketing: boolean
  registered_at: string | null
  role: Role
  status: 'active' | 'blocked'
}
export type BookingKind = 'table' | 'tour' | 'event' | 'custom-beer'
export type BookingStatus = 'new' | 'confirmed' | 'done' | 'cancelled'
export interface Booking {
  id: string
  kind: BookingKind
  date: string
  guests: number
  comment: string | null
  status: BookingStatus
  assigned_to: number | null
  created_at: string
}
export interface Person { full_name: string; phone: string | null; username: string | null }
export interface StaffBooking extends Booking { telegram_id: number; guest?: Person }
export interface Application {
  id: string
  desired_role: Role
  about: string
  certificates: string | null
  experience_years: number
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  applicant?: Person
}
export interface Invite { code: string; role: Role; expires_at: string; used_by: number | null; created_at: string }
export interface BeerRow {
  id: string; name: string; style: string; family: 'light' | 'red' | 'dark'; abv: string; ibu: number; color: string
  description: string; tasting_notes: string | null; pairing: string | null; published: boolean; sort: number
}
