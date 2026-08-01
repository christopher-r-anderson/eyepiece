import { expect, test } from './fixtures'
import { makeAdminClient } from './support/collections-fixture'
import {
  createPasswordProbeUser,
  deleteUserByEmail,
} from './support/admin-users'
import type { Page } from '@playwright/test'

// The mutation forms post natively to their server-fn action URLs before
// hydration; these journeys run with JavaScript off entirely, so every
// assertion is about real document POSTs and their 303 redirects.
test.use({ javaScriptEnabled: false })

test('a no-JS login failure returns to the form with the error', async ({
  page,
}) => {
  await page.goto('/login?next=%2Ffavorites')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password')
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForURL((url) => url.searchParams.has('formError'))
  await expect(page.getByText('Email or password is incorrect.')).toBeVisible()
  // the next target survives the round trip
  expect(new URL(page.url()).searchParams.get('next')).toBe('/favorites')
})

test('a no-JS login succeeds and honors next', async ({ page }) => {
  await page.goto('/login?next=%2Ffavorites')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('hunter2')
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForURL('/favorites')
  // the session rode the redirect: the private page rendered, not /login
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()
})

test('a no-JS profile update round-trips with a status', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill('user1@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('hunter2')
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('/')

  await page.goto('/settings/profile')
  const displayName = page.getByRole('textbox', {
    name: 'Display Name (shown publicly)',
  })
  // resubmitting the existing name keeps the journey idempotent under
  // parallel workers while still exercising the real upsert
  await expect(displayName).not.toHaveValue('')
  await page.getByRole('button', { name: 'Update' }).click()

  await page.waitForURL((url) => url.searchParams.get('status') === 'updated')
  await expect(page.getByText('Profile updated.')).toBeVisible()
})

test('a no-JS forgot-password submit lands on the sent panel', async ({
  page,
}, testInfo) => {
  // a per-worker user keeps parallel projects clear of Supabase's
  // between-reset-emails rate limit (one per address per minute)
  const email = `e2e-nojs-forgot-${testInfo.workerIndex}@example.com`
  await deleteUserByEmail(email)
  const admin = makeAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password: 'a-long-enough-passphrase',
    email_confirm: true,
  })
  expect(error).toBeNull()
  try {
    await page.goto('/auth/forgot-password')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByRole('button', { name: 'Reset Password' }).click()

    await page.waitForURL((url) => url.searchParams.get('status') === 'sent')
    await expect(page.getByText('Password reset sent!')).toBeVisible()
  } finally {
    await deleteUserByEmail(email)
  }
})

test('a no-JS registration lands on the sent panel', async ({
  page,
}, testInfo) => {
  const email = `e2e-nojs-register-${testInfo.workerIndex}@example.com`
  const admin = makeAdminClient()
  const deleteRegisteredUser = async () => {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = data.users.find((candidate) => candidate.email === email)
    if (user) {
      await admin.auth.admin.deleteUser(user.id)
    }
  }
  // a previous interrupted run may have left the user behind
  await deleteRegisteredUser()
  try {
    await page.goto('/register')
    await page
      .getByRole('textbox', { name: 'Display Name (shown publicly)' })
      .fill('No-JS Register Probe')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill('a-long-enough-passphrase')
    await page.getByRole('button', { name: 'Register' }).click()

    await page.waitForURL((url) => url.searchParams.get('status') === 'sent')
    await expect(page.getByText('Registration successful!')).toBeVisible()
  } finally {
    await deleteRegisteredUser()
  }
})

// the back field is the one bespoke redirect input: a form hosted away
// from its home page must round-trip failures to its actual posting URL
test('a no-JS resend failure returns to the confirm-error spelling', async ({
  page,
}) => {
  await page.goto('/auth/confirm-error?err=otp_expired&type=email')
  // 'a@b' satisfies native email validation but fails the schema's
  await page.getByRole('textbox', { name: 'Email' }).fill('a@b')
  await page.getByRole('button', { name: 'Send' }).click()

  await page.waitForURL((url) => url.searchParams.has('formError'))
  const url = new URL(page.url())
  expect(url.pathname).toBe('/auth/confirm-error')
  expect(url.searchParams.get('err')).toBe('otp_expired')
  expect(url.searchParams.get('type')).toBe('email')
  await expect(
    page.getByText('Please check the form and try again.'),
  ).toBeVisible()
})

test('a no-JS first login completes the profile and lands on next', async ({
  page,
}, testInfo) => {
  const email = `e2e-nojs-complete-${testInfo.workerIndex}@example.com`
  const password = 'a-long-enough-passphrase'
  await deleteUserByEmail(email)
  const admin = makeAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(error).toBeNull()
  try {
    await page.goto('/login?next=%2Ffavorites')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    // no profile yet: the guard forwards to complete-profile with next
    await page.waitForURL((url) => url.pathname === '/complete-profile')
    await page
      .getByRole('textbox', { name: 'Display Name (shown publicly)' })
      .fill('No-JS Complete Probe')
    await page.getByRole('button', { name: 'Create' }).click()

    // the create context redirects straight to the destination
    await page.waitForURL('/favorites')
    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()
  } finally {
    await deleteUserByEmail(email)
  }
})

test('a no-JS resend for an unconfirmed account lands on the sent panel', async ({
  page,
}, testInfo) => {
  const email = `e2e-nojs-resend-${testInfo.workerIndex}@example.com`
  await deleteUserByEmail(email)
  const admin = makeAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password: 'a-long-enough-passphrase',
    email_confirm: false,
  })
  expect(error).toBeNull()
  try {
    await page.goto('/auth/confirm-error?err=otp_expired&type=email')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByRole('button', { name: 'Send' }).click()

    await page.waitForURL((url) => url.searchParams.get('status') === 'sent')
    const url = new URL(page.url())
    expect(url.pathname).toBe('/auth/confirm-error')
    expect(url.searchParams.get('err')).toBe('otp_expired')
    expect(url.searchParams.get('type')).toBe('email')
    await expect(page.getByText('Confirmation Email Sent!')).toBeVisible()
  } finally {
    await deleteUserByEmail(email)
  }
})

async function logInNoJs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('/')
}

test('a no-JS password update with a destination completes server-side', async ({
  page,
}, testInfo) => {
  test.slow()
  const email = `e2e-nojs-password-next-${testInfo.workerIndex}@example.com`
  await deleteUserByEmail(email)
  await createPasswordProbeUser(
    email,
    'the-original-passphrase',
    'No-JS Password Probe',
  )
  try {
    await logInNoJs(page, email, 'the-original-passphrase')
    await page.goto('/auth/update-password?next=%2Fsettings%2Fprofile')
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill('the-replacement-passphrase')
    await page.getByRole('button', { name: 'Update' }).click()
    await page.waitForURL((url) => url.pathname === '/settings/profile')
  } finally {
    await deleteUserByEmail(email)
  }
})

test('a no-JS password update without a destination really changes it', async ({
  page,
  browser,
}, testInfo) => {
  test.slow()
  const email = `e2e-nojs-password-${testInfo.workerIndex}@example.com`
  const newPassword = 'the-replacement-passphrase'
  await deleteUserByEmail(email)
  await createPasswordProbeUser(
    email,
    'the-original-passphrase',
    'No-JS Password Probe',
  )
  try {
    await logInNoJs(page, email, 'the-original-passphrase')
    await page.goto('/auth/update-password')
    await page.getByRole('textbox', { name: 'Password' }).fill(newPassword)
    await page.getByRole('button', { name: 'Update' }).click()
    await page.waitForURL((url) => url.searchParams.get('status') === 'updated')
    await expect(page.getByText('Password updated successfully!')).toBeVisible()

    // the change is real: a fresh session logs in with the new password
    const freshContext = await browser.newContext({
      baseURL: 'http://localhost:8888',
      javaScriptEnabled: false,
    })
    const freshPage = await freshContext.newPage()
    await logInNoJs(freshPage, email, newPassword)
    await freshContext.close()
  } finally {
    await deleteUserByEmail(email)
  }
})
