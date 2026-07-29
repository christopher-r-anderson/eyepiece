import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { makeAuthCommands } from './auth.commands'
import { setPasswordFieldSchema } from './forms/components/set-password-field.schema'
import { INVALID_INPUT_CODE } from '@/components/form-errors'
import { nextSchema } from '@/lib/route.schema'
import { redirectWithParams } from '@/lib/form-action-redirect'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { profileSchema } from '@/domain/profile/profile.schema'
import { resultIsError } from '@/lib/result'

// Native (no-JS) form posts land here via each form's action={fn.url}.
// Hydrated submits never reach these: the forms intercept submit and run
// the client command, so these only answer full-document POSTs and must
// always end in a redirect - a returned value would render as raw JSON.

function parseOrRedirectBack<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
  defaultBackHref: string,
): { data: z.output<TSchema>; backHref: string } {
  const formData = data instanceof FormData ? Object.fromEntries(data) : {}
  // a posted back field (the confirm-error page's err/type spelling) wins
  // even when the rest of the form is invalid, so every redirect lands on
  // the page that was actually submitted
  const backHref =
    nextSchema.parse(
      typeof formData.back === 'string' ? formData.back : undefined,
    ) ?? defaultBackHref
  const parsed = schema.safeParse(formData)
  if (!parsed.success) {
    redirectWithParams(backHref, {
      formError: INVALID_INPUT_CODE,
      next: nextSchema.parse(
        typeof formData.next === 'string' ? formData.next : undefined,
      ),
    })
  }
  return { data: parsed.data, backHref }
}

function authCommands() {
  return makeAuthCommands(createUserSupabaseServerClient())
}

export const loginFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const { data, backHref } = parseOrRedirectBack(
      z.object({ email: z.email(), password: z.string(), next: nextSchema }),
      formData,
      '/login',
    )
    const result = await authCommands().login({
      email: data.email,
      password: data.password,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code ?? 'unknown',
        next: data.next,
      })
    }
    redirectWithParams(data.next ?? '/')
  })

export const registerFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const { data, backHref } = parseOrRedirectBack(
      z.object({
        email: z.email(),
        displayName: profileSchema.shape.displayName,
        password: setPasswordFieldSchema,
        redirectTo: z.url(),
        next: nextSchema,
      }),
      formData,
      '/register',
    )
    const result = await authCommands().register({
      email: data.email,
      displayName: data.displayName,
      password: data.password,
      redirectTo: data.redirectTo,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code ?? 'unknown',
        next: data.next,
      })
    }
    redirectWithParams(backHref, { status: 'sent', next: data.next })
  })

export const forgotPasswordFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const { data, backHref } = parseOrRedirectBack(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
        next: nextSchema,
        back: nextSchema,
      }),
      formData,
      '/auth/forgot-password',
    )
    const result = await authCommands().resetPassword({
      email: data.email,
      redirectTo: data.redirectTo,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code ?? 'unknown',
        next: data.next,
      })
    }
    redirectWithParams(backHref, { status: 'sent', next: data.next })
  })

export const resendConfirmationFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const { data, backHref } = parseOrRedirectBack(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
        next: nextSchema,
        back: nextSchema,
      }),
      formData,
      '/auth/confirm-error',
    )
    const result = await authCommands().resendRegisterConfirmation({
      email: data.email,
      redirectTo: data.redirectTo,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code ?? 'unknown',
        next: data.next,
      })
    }
    redirectWithParams(backHref, { status: 'sent', next: data.next })
  })

export const updatePasswordFormAction = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const { data, backHref } = parseOrRedirectBack(
      z.object({ password: setPasswordFieldSchema, next: nextSchema }),
      formData,
      '/auth/update-password',
    )
    const result = await authCommands().updatePassword({
      password: data.password,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.code ?? 'unknown',
        next: data.next,
      })
    }
    if (data.next) {
      // the status page's countdown is client code; a no-JS user would
      // wait forever, so the native flow completes server-side
      redirectWithParams(data.next)
    }
    redirectWithParams(backHref, { status: 'updated' })
  })
