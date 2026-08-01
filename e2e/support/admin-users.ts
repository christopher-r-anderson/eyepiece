import { expect } from '@playwright/test'
import { makeAdminClient } from './collections-fixture'

export async function deleteUserByEmail(email: string) {
  const admin = makeAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = data.users.find((candidate) => candidate.email === email)
  if (user) {
    await admin.auth.admin.deleteUser(user.id)
  }
}

export async function createPasswordProbeUser(
  email: string,
  password: string,
  displayName: string,
) {
  const admin = makeAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(error).toBeNull()
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: created.user!.id, display_name: displayName })
  expect(profileError).toBeNull()
}
