import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(pages)/settings/')({
  beforeLoad: () => {
    throw redirect({
      to: '/settings/profile',
      replace: true,
    })
  },
})
