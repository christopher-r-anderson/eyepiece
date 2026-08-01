import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { css } from 'styled-system/css'
import { formErrorCopy } from '@/components/form-errors'
import { Heading } from '@/components/ui/heading'
import { urlToNextParam } from '@/lib/utils'
import {
  formResultSearchParamsSchema,
  redirectSearchParamsSchema,
} from '@/lib/route.schema'
import { FormStatusSwitcher, formStatusPanelCss } from '@/components/ui/forms'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { UpsertProfileForm } from '@/features/profiles/forms/upsert-profile-form'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/(private)/(pages)/complete-profile')({
  component: CompleteProfilePage,
  validateSearch: redirectSearchParamsSchema.extend(
    formResultSearchParamsSchema.shape,
  ),
})

function CompleteProfilePage() {
  const { user } = Route.useRouteContext()
  const { next: nextParam, formError } = Route.useSearch()
  const next = nextParam ? urlToNextParam(nextParam) : undefined
  const navigate = Route.useNavigate()
  const queueToastMessage = useQueueToastMessage()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const onUpdateSuccess = useCallback(() => {
    if (next) {
      queueToastMessage({ title: 'Profile created' })
      void navigate({ to: next, replace: true })
      return
    }
    setShowSuccessMessage(true)
  }, [next, navigate, queueToastMessage])

  return (
    <FormStatusSwitcher
      showStatus={showSuccessMessage}
      status={<SuccessStandardMessage />}
    >
      <UpsertProfileForm
        actionType="create"
        next={next}
        initialFormError={formErrorCopy(formError)}
        onSuccess={onUpdateSuccess}
        headingLevel={1}
        surface="panel"
        initialData={{ id: user.id }}
      />
    </FormStatusSwitcher>
  )
}

function SuccessStandardMessage() {
  return (
    <section className={css(formStatusPanelCss)}>
      <Heading level={1}>Profile created!</Heading>
      <p>
        Visit our <Link to="/">homepage</Link>
      </p>
    </section>
  )
}
