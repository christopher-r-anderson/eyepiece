import path from 'node:path'

export const STORAGE_STATE_PATH = path.resolve(
  process.cwd(),
  'playwright/.auth/user.json',
)
