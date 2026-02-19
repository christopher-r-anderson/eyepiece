import type { HeadingLevel } from '@/components/ui/heading'
import { Heading } from '@/components/ui/heading'

const PrettyError = ({
  error,
  headingLevel,
}: {
  error: Error
  headingLevel: HeadingLevel
}) => {
  return (
    <>
      <Heading headingLevel={headingLevel}>Error</Heading>
      <dl>
        {error.name && (
          <>
            <dt>Name</dt>
            <dd>
              <pre>{error.name}</pre>
            </dd>
          </>
        )}
        {'code' in error && typeof error.code === 'string' && (
          <>
            <dt>Code</dt>
            <dd>
              <pre>{error.code}</pre>
            </dd>
          </>
        )}
        {error.message && (
          <>
            <dt>Message</dt>
            <dd>
              <pre>{error.message}</pre>
            </dd>
          </>
        )}
        {error.stack && (
          <>
            <dt>Stack</dt>
            <dd>
              <pre>{error.stack}</pre>
            </dd>
          </>
        )}
      </dl>
      {error.cause && (
        <PrettyException
          error={error.cause}
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
  if (error instanceof Error) {
    return <PrettyError error={error} headingLevel={headingLevel} />
  }
  return (
    <div>
      <Heading headingLevel={headingLevel}>Unknown error</Heading>
      <p>An unexpected error occurred.</p>
    </div>
  )
}
