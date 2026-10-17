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

export interface RakursSlot {
  id: string; title: string; starts_at: string; capacity: number; price_rub: number
  status: 'open' | 'closed' | 'cancelled'; taken: number; free: number; lead: string | null
}
export type SignupStatus = 'registered' | 'attended' | 'no_show' | 'cancelled'
export interface RakursSignup {
  id: string; slot_id: string; guests: number; set_beers: string[]; focus_beer: string
  comment: string | null; status: SignupStatus; created_at: string
}
export interface MySignup extends RakursSignup {
  slot: { title: string; starts_at: string; price_rub: number; status: string }
}
export interface StaffSlot {
  id: string; title: string; starts_at: string; capacity: number; price_rub: number
  status: 'open' | 'closed' | 'cancelled'; sommelier_id: number | null
  signups: (RakursSignup & { telegram_id: number; guest?: Person })[]
}
export interface WaitlistEntry { contact: string; kind: 'email' | 'phone'; created_at: string }
