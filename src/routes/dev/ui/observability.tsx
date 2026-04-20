import { CatchBoundary, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, InputGroup, TextField } from '@/components/ui/forms'
import { useTypedActionState } from '@/components/ui/forms.hooks'
import { CapturedPrettyError } from '@/app/layout/route-error'
import { Err, Ok } from '@/lib/result'
import { Link } from '@/components/ui/link'

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

export const Route = createFileRoute('/dev/ui/observability')({
  component: DevUiObservabilityPage,
})

function DevUiObservabilityPage() {
  const [renderAttempt, setRenderAttempt] = useState(0)
  const [shouldThrowRenderError, setShouldThrowRenderError] = useState(false)

  return (
    <div css={{ display: 'grid', gap: 'var(--space-section-gap)' }}>
      <section
        css={{
          display: 'grid',
          gap: 'var(--space-3)',
          maxWidth: 'var(--size-reading-max)',
        }}
      >
        <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h2 css={{ margin: 0, fontSize: 'var(--text-xl)' }}>
            Observability Workbench
          </h2>
          <p css={{ margin: 0 }}>
            Use these deterministic scenarios to verify the current Sentry and
            error-boundary behavior in development.
          </p>
        </div>
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
      </section>

      <div
        css={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
          alignItems: 'start',
        }}
      >
        <article css={scenarioCardCss}>
          <ScenarioHeading
            title="Client Render Error"
            description="Throws during render inside a local catch boundary."
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
        </article>

        <article css={scenarioCardCss}>
          <ScenarioHeading
            title="Handled UI Boundary Error"
            description="Exercises the shared form boundary with structured handled field errors."
          />
          <HandledObservabilityForm />
        </article>

        <article css={scenarioCardCss}>
          <ScenarioHeading
            title="Server Thrown Error"
            description="Performs a full document navigation into a throwing route so the request passes through the existing server middleware."
          />
          <Button
            onPress={() => {
              window.location.assign('/dev/ui/observability/server-error')
            }}
          >
            Open server error route with full reload
          </Button>
        </article>

        <article css={scenarioCardCss}>
          <ScenarioHeading
            title="Handled 400 Validation Error"
            description="Triggers a handled 400 route response that should stay low-noise."
          />
          <Link to="/dev/ui/observability/handled-400">
            Open handled 400 route
          </Link>
        </article>
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

function ScenarioHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div css={{ display: 'grid', gap: 'var(--space-2)' }}>
      <h3 css={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h3>
      <p css={{ margin: 0 }}>{description}</p>
    </div>
  )
}

const scenarioCardCss = {
  display: 'grid',
  gap: 'var(--space-4)',
  padding: 'var(--space-5)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--secondary-bg)',
}
