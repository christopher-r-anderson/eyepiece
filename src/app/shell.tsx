import { Outlet } from '@tanstack/react-router'
import { AppProviders } from './providers'
import { AppLayout } from './layout/layout'
import { ToastRegion } from '@/components/ui/toast'

export function App() {
  return (
    <AppProviders>
      <ToastRegion />
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AppProviders>
  )
}
