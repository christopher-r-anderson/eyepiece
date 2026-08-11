import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useEvent } from './use-event'
import type { formResultSearchParamsSchema } from '@/lib/route.schema'
import type { z } from 'zod'

type FormStatus = z.infer<typeof formResultSearchParamsSchema>['status']

// A form action's redirect status is one-shot: the SSR'd result is the
// no-JS feedback; once hydrated, seed from it and strip it (and formError)
export function useOneShotFormStatus(
  status: FormStatus,
  onStatus?: (status: NonNullable<FormStatus>) => void,
) {
  const navigate = useNavigate()
  const onStatusRef = useEvent(onStatus)
  const [seededStatus] = useState(status)
  useEffect(() => {
    if (!status) return
    onStatusRef.current?.(status)
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, status: undefined, formError: undefined }),
      replace: true,
    })
  }, [status, navigate, onStatusRef])
  return seededStatus
}
