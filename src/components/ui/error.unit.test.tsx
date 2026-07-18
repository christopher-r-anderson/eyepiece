import { createElement } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrettyException, getPrettyExceptionDisplay } from './error'

describe('getPrettyExceptionDisplay', () => {
  it('keeps dev details but never exposes stack text in the view model', () => {
    const error = Object.assign(new Error('Boom'), {
      code: 'EXPLODED',
      stack: 'top secret stack',
    })

    expect(getPrettyExceptionDisplay(error, { showDetails: true })).toEqual({
      title: 'Error',
      message: 'Boom',
      name: 'Error',
      code: 'EXPLODED',
      cause: undefined,
      showDetails: true,
    })
  })

  it('falls back to a generic message when exception details are disabled', () => {
    expect(
      getPrettyExceptionDisplay(new Error('do not leak'), {
        showDetails: false,
      }),
    ).toEqual({
      title: 'Error',
      message: 'An unexpected error occurred.',
      name: undefined,
      code: undefined,
      cause: undefined,
      showDetails: false,
    })
  })
})

describe('PrettyException', () => {
  it('does not render the raw stack trace for errors', () => {
    const error = new Error('Dev observability: server route failure')
    error.stack = 'server stack should not render'

    render(createElement(PrettyException, { error, headingLevel: 2 }))

    expect(screen.queryByText('Stack')).toBeNull()
    expect(screen.queryByText('server stack should not render')).toBeNull()
  })

  it('renders one heading and the cause chain as nested data', () => {
    const error = new Error('outer failure', {
      cause: new Error('inner failure', { cause: 'plain string cause' }),
    })

    const { container } = render(
      createElement(PrettyException, { error, headingLevel: 2 }),
    )
    const view = within(container)

    const headings = view.getAllByRole('heading')
    expect(headings.length).toBe(1)
    expect(headings[0]?.tagName).toBe('H2')

    // both causes stay represented, one Cause row per depth
    expect(view.getAllByText('Cause').length).toBe(2)
    expect(view.queryByText('outer failure')).not.toBeNull()
    expect(view.queryByText('inner failure')).not.toBeNull()
    // non-Error causes render the generic message, never the raw value
    expect(view.queryByText('plain string cause')).toBeNull()
    expect(view.queryByText('An unexpected error occurred.')).not.toBeNull()
  })
})
