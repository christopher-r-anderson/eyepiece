import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { makeAuthCommands } from './auth.commands'
import { setPasswordFieldSchema } from './forms/components/set-password-field.schema'
import { redirectSearchParamsSchema } from '@/lib/route.schema'
import { createUserSupabaseServerClient } from '@/integrations/supabase/user/server.server'
import { profileSchema } from '@/domain/profile/profile.schema'
import { resultIsError } from '@/lib/result'

// Native (no-JS) form posts land here via each form's action={fn.url}.
// Hydrated submits never reach these: the forms intercept submit and run
// the client command, so these only answer full-document POSTs and must
// always end in a redirect - a returned value would render as raw JSON.

const nextSchema = redirectSearchParamsSchema.shape.next

export const INVALID_FORM_MESSAGE = 'Please check the form and try again.'

function redirectWithParams(
  href: string,
  params: Record<string, string | undefined>,
): never {
  const url = new URL(href, 'http://relative.local')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    }
  }
  // 303 turns the form POST into a GET at the target; 307 would re-POST
  throw redirect({
    href: `${url.pathname}${url.search}${url.hash}`,
    statusCode: 303,
  })
}

function parseOrRedirectBack<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
  backHref: string,
): z.output<TSchema> {
  const formData = data instanceof FormData ? Object.fromEntries(data) : {}
  const parsed = schema.safeParse(formData)
  if (!parsed.success) {
    redirectWithParams(backHref, {
      formError: INVALID_FORM_MESSAGE,
      next: nextSchema.parse(
        typeof formData.next === 'string' ? formData.next : undefined,
      ),
    })
  }
  return parsed.data
}

function authCommands() {
  return makeAuthCommands(createUserSupabaseServerClient())
}

export const loginFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const data = parseOrRedirectBack(
      z.object({ email: z.email(), password: z.string(), next: nextSchema }),
      formData,
      '/login',
    )
    const result = await authCommands().login({
      email: data.email,
      password: data.password,
    })
    if (resultIsError(result)) {
      redirectWithParams('/login', {
        formError: result.error.message,
        next: data.next,
      })
    }
    throw redirect({ href: data.next ?? '/', statusCode: 303 })
  })

export const registerFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const data = parseOrRedirectBack(
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
      redirectWithParams('/register', {
        formError: result.error.message,
        next: data.next,
      })
    }
    redirectWithParams('/register', { status: 'sent', next: data.next })
  })

export const forgotPasswordFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const data = parseOrRedirectBack(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
        next: nextSchema,
        // the posting page when it is not the default (confirm-error)
        back: nextSchema,
      }),
      formData,
      '/auth/forgot-password',
    )
    const backHref = data.back ?? '/auth/forgot-password'
    const result = await authCommands().resetPassword({
      email: data.email,
      redirectTo: data.redirectTo,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.message,
        next: data.next,
      })
    }
    redirectWithParams(backHref, { status: 'sent', next: data.next })
  })

export const resendConfirmationFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const data = parseOrRedirectBack(
      z.object({
        email: z.email(),
        redirectTo: z.url(),
        next: nextSchema,
        // the posting page (confirm-error's err/type spelling)
        back: nextSchema,
      }),
      formData,
      '/auth/confirm-error',
    )
    const backHref = data.back ?? '/auth/confirm-error'
    const result = await authCommands().resendRegisterConfirmation({
      email: data.email,
      redirectTo: data.redirectTo,
    })
    if (resultIsError(result)) {
      redirectWithParams(backHref, {
        formError: result.error.message,
        next: data.next,
      })
    }
    redirectWithParams(backHref, { status: 'sent', next: data.next })
  })

export const updatePasswordFormAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data: formData }) => {
    const data = parseOrRedirectBack(
      z.object({ password: setPasswordFieldSchema, next: nextSchema }),
      formData,
      '/auth/update-password',
    )
    const result = await authCommands().updatePassword({
      password: data.password,
    })
    if (resultIsError(result)) {
      redirectWithParams('/auth/update-password', {
        formError: result.error.message,
        next: data.next,
      })
    }
    redirectWithParams('/auth/update-password', {
      status: 'updated',
      next: data.next,
    })
  })
