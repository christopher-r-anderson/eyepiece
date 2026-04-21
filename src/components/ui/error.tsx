import type { HeadingLevel } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

const SHOW_EXCEPTION_DETAILS = import.meta.env.DEV

function getErrorCode(error: Error) {
  if ('code' in error && typeof error.code === 'string') {
    return error.code
  }

  return undefined
}

export function getPrettyExceptionDisplay(
  error: unknown,
  options?: { showDetails?: boolean },
) {
  const showDetails = options?.showDetails ?? SHOW_EXCEPTION_DETAILS

  if (!(error instanceof Error)) {
    return {
      title: 'Unknown error',
      message: 'An unexpected error occurred.',
      name: undefined,
      code: undefined,
      cause: undefined,
      showDetails: false,
    }
  }

  if (!showDetails) {
    return {
      title: 'Error',
      message: 'An unexpected error occurred.',
      name: undefined,
      code: undefined,
      cause: undefined,
      showDetails: false,
    }
  }

  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred.',
    name: error.name || undefined,
    code: getErrorCode(error),
    cause: error.cause,
    showDetails: true,
  }
}

const PrettyError = ({
  error,
  headingLevel,
}: {
  error: Error
  headingLevel: HeadingLevel
}) => {
  const display = getPrettyExceptionDisplay(error)

  return (
    <>
      <Heading headingLevel={headingLevel}>{display.title}</Heading>
      <dl>
        {display.name && (
          <>
            <dt>Name</dt>
            <dd>
              <pre>{display.name}</pre>
            </dd>
          </>
        )}
        {display.code && (
          <>
            <dt>Code</dt>
            <dd>
              <pre>{display.code}</pre>
            </dd>
          </>
        )}
        {display.message && (
          <>
            <dt>Message</dt>
            <dd>
              <pre>{display.message}</pre>
            </dd>
          </>
        )}
      </dl>
      {display.cause && (
        <PrettyException
          error={display.cause}
          headingLevel={
            (headingLevel < 6 ? headingLevel + 1 : 6) as HeadingLevel
          }
        />
      )}
    </>
  )
}

export function PrettyException({
  error,
  headingLevel,
}: {
  error: unknown
  headingLevel: HeadingLevel
}) {
  const display = getPrettyExceptionDisplay(error)

  if (error instanceof Error) {
    return <PrettyError error={error} headingLevel={headingLevel} />
  }

  return (
    <div>
      <Heading headingLevel={headingLevel}>{display.title}</Heading>
      <p>{display.message}</p>
    </div>
  )
}
