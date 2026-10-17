import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { About, Beer, Contacts, Events, Home, NotFound, Restaurant, Shop } from './pages/Content'
import { Passport, Rakurs, RakursSignupPage } from './pages/Rakurs'
import { StaffRakurs } from './pages/StaffRakurs'
import { StaffWaitlist } from './pages/StaffWaitlist'
import { Soon } from './pages/Soon'
import { LaunchGate } from './components/LaunchGate'
import { getLaunch } from './lib/launch'
import { Account, Booking, Login, Register } from './pages/Account'
import {
  Apply,
  InvitePage,
  StaffApplications,
  StaffBeers,
  StaffBookings,
  StaffIndex,
  StaffInvites,
  StaffLayout,
  StaffUsers,
} from './pages/Staff'

export default function App() {
  return (
    <Routes>
      <Route path="soon" element={<Soon at={getLaunch(import.meta.env).at} />} />
      <Route element={<LaunchGate />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="beer" element={<Beer />} />
          <Route path="restaurant" element={<Restaurant />} />
          <Route path="rakurs" element={<Rakurs />} />
          <Route path="tours" element={<Navigate to="/rakurs" replace />} />
          <Route path="events" element={<Events />} />
          <Route path="shop" element={<Shop />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="login" element={<Login />} />
          <Route element={<RequireAuth registered={false} />}>
            <Route path="register" element={<Register />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path="account" element={<Account />} />
            <Route path="booking" element={<Booking />} />
            <Route path="apply" element={<Apply />} />
            <Route path="rakurs/:id" element={<RakursSignupPage />} />
            <Route path="passport" element={<Passport />} />
          </Route>
          <Route path="invite/:code" element={<InvitePage />} />
          <Route element={<RequireAuth staff />}>
            <Route path="staff" element={<StaffLayout />}>
              <Route index element={<StaffIndex />} />
              <Route
                element={<RequireAuth perm={['bookings:view_all', 'bookings:view_assigned']} />}
              >
                <Route path="bookings" element={<StaffBookings />} />
              </Route>
              <Route element={<RequireAuth perm={['rakurs:view']} />}>
                <Route path="rakurs" element={<StaffRakurs />} />
              </Route>
              <Route element={<RequireAuth perm={['users:view']} />}>
                <Route path="waitlist" element={<StaffWaitlist />} />
              </Route>
              <Route element={<RequireAuth perm={['beers:notes']} />}>
                <Route path="beers" element={<StaffBeers />} />
              </Route>
              <Route element={<RequireAuth perm={['users:view']} />}>
                <Route path="users" element={<StaffUsers />} />
              </Route>
              <Route element={<RequireAuth perm={['applications:review']} />}>
                <Route path="applications" element={<StaffApplications />} />
              </Route>
              <Route element={<RequireAuth perm={['invites:manage']} />}>
                <Route path="invites" element={<StaffInvites />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
