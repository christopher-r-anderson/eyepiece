import { rm } from 'node:fs/promises'
import {
  FIXTURE_HIT_LOG,
  FIXTURE_MISS_LOG,
} from '@/integrations/provider-fixtures'

export default async function clearFixtureLogs() {
  await rm(FIXTURE_MISS_LOG, { force: true })
  await rm(FIXTURE_HIT_LOG, { force: true })
}
