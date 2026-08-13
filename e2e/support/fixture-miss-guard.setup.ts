import { rm } from 'node:fs/promises'
import { FIXTURE_MISS_LOG } from '@/integrations/provider-fixtures'

export default async function clearFixtureMissLog() {
  await rm(FIXTURE_MISS_LOG, { force: true })
}
