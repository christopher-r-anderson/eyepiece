import { Outlet } from '@tanstack/react-router'
import { AppProviders } from './providers'
import { AppLayout } from './layout/layout'

export function App() {
  return (
    <AppProviders>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AppProviders>
  )
}
