import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
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
})
