import { CatchBoundary, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import {
  DevLinkCard,
  DevPanel,
  DevTitleBlock,
  devCardGridCss,
} from '../-components'
import { Button } from '@/components/ui/button'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { CapturedPrettyError } from '@/app/layout/route-error'
import { Link } from '@/components/ui/link'
import { Err, Ok } from '@/lib/result'

const handledScenarioSchema = z.object({
  displayName: z.string().min(1),
})

function handledScenarioAction(data: z.infer<typeof handledScenarioSchema>) {
  if (data.displayName.toLowerCase() === 'success') {
    return Promise.resolve(Ok(undefined))
  }

  return Promise.resolve(
    Err({
      code: 'INVALID_INPUT',
      message: 'Invalid input',
      fieldErrors: {
        displayName:
          'Use "success" to exercise the success path; any other value stays handled in the form boundary.',
      },
    }),
  )
}

export const Route = createFileRoute('/dev/observability/')({
  component: DevObservabilityPage,
})

function DevObservabilityPage() {
  const [renderAttempt, setRenderAttempt] = useState(0)
  const [shouldThrowRenderError, setShouldThrowRenderError] = useState(false)

  return (
    <div css={{ display: 'grid', gap: 'var(--space-section-gap)' }}>
      <DevPanel css={{ maxWidth: 'var(--size-reading-max)' }}>
        <DevTitleBlock
          title="Verification Checklist"
          description="Use these scenarios to verify the current Sentry and error-boundary behavior in development."
        />
        <ol css={{ margin: 0, paddingInlineStart: '1.25rem' }}>
          <li>
            Client render error should be captured with boundary metadata.
          </li>
          <li>Handled UI form errors should stay visible and low-noise.</li>
          <li>
            Server route failures should be captured by the existing server
            middleware.
          </li>
          <li>
            Handled 400 responses should render but should not be reported.
          </li>
        </ol>
      </DevPanel>

      <div
        css={{
          ...devCardGridCss,
          gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
        }}
      >
        <DevPanel as="article">
          <DevTitleBlock
            title="Client Render Error"
            description="Throws during render inside a local catch boundary."
            headingLevel={3}
          />
          <CatchBoundary
            getResetKey={() => `${renderAttempt}:${shouldThrowRenderError}`}
            errorComponent={({ error, reset }) => (
              <div css={{ display: 'grid', gap: 'var(--space-3)' }}>
                <CapturedPrettyError
                  error={error}
                  headingLevel={3}
                  captureContext={{
                    boundaryKind: 'catch',
                    feature: 'observability',
                    operation: 'client_render_error',
                  }}
                />
                <Button
                  onPress={() => {
                    setShouldThrowRenderError(false)
                    setRenderAttempt((value) => value + 1)
                    reset()
                  }}
                >
                  Reset client render scenario
                </Button>
              </div>
            )}
          >
            {shouldThrowRenderError ? (
              <DevRenderError />
            ) : (
              <Button onPress={() => setShouldThrowRenderError(true)}>
                Trigger client render error
              </Button>
            )}
          </CatchBoundary>
        </DevPanel>

        <DevPanel as="article">
          <DevTitleBlock
            title="Handled UI Boundary Error"
            description="Exercises the shared form boundary with structured handled field errors."
            headingLevel={3}
          />
          <HandledObservabilityForm />
        </DevPanel>

        <DevLinkCard
          title="Server Thrown Error"
          description="Performs a full document navigation into a throwing route so the request passes through the existing server middleware."
          action={
            <Button
              onPress={() => {
                window.location.assign('/dev/observability/server-error')
              }}
            >
              Open server error route
            </Button>
          }
        />

        <DevLinkCard
          title="Handled 400 Validation Error"
          description="Triggers a handled 400 route response that should stay low-noise."
          action={
            <Link to="/dev/observability/handled-400">
              Open handled 400 route
            </Link>
          }
        />
      </div>
    </div>
  )
}

function DevRenderError(): null {
  throw new Error('Dev observability: client render failure')
}

function HandledObservabilityForm() {
  const [state, formAction, isPending] = useTypedActionState(
    handledScenarioSchema,
    handledScenarioAction,
  )

  return (
    <Form
      action={formAction}
      validationErrors={state.fieldErrors}
      formError={state.error}
      aria-busy={isPending || undefined}
      controls={
        <Button variant="primary" type="submit" isDisabled={isPending}>
          Submit handled scenario
        </Button>
      }
    >
      <InputGroup>
        <TextField
          name="displayName"
          type="text"
          label="Display Name"
          defaultValue={state.formData?.displayName}
          description='Enter "success" to clear the handled error.'
        />
      </InputGroup>
    </Form>
  )
}
