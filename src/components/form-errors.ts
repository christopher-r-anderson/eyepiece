// Copy for form failures, keyed by Supabase auth error codes plus the
// features' own literals. The native (no-JS) redirect carries only the
// code - never message text - so a crafted link cannot display arbitrary
// copy; both the hydrated and native paths read from this one map.
export const INVALID_FORM_CODE = 'invalid_form'

export const FORM_ERROR_COPY: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Please confirm your email address first.',
  user_already_exists: 'An account with this email already exists.',
  email_exists: 'An account with this email already exists.',
  weak_password: 'Please choose a longer password.',
  same_password: 'Choose a password different from your current one.',
  over_request_rate_limit: 'Too many attempts. Please wait and try again.',
  [INVALID_FORM_CODE]: 'Please check the form and try again.',
  // the profile actions speak the same channel with their own codes
  invalid_input: 'Please check the form and try again.',
}

const UNKNOWN_FORM_ERROR_COPY = 'Something went wrong. Please try again.'

// for seeding a form from a redirect's code param: any unmapped or
// unrecognized code gets the generic copy rather than echoing input
export function formErrorCopy(code: string | undefined) {
  if (!code) return undefined
  return FORM_ERROR_COPY[code] ?? UNKNOWN_FORM_ERROR_COPY
}
