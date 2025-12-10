import { Outlet } from '@tanstack/react-router'
import { AppProviders } from './AppProviders'
import { AppLayout } from './layout/AppLayout'

export function App() {
  return (
    <AppProviders>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AppProviders>
  )
}
