import { tanstackConfig } from '@tanstack/eslint-config'
import queryPlugin from '@tanstack/eslint-plugin-query'

export default [...tanstackConfig, ...queryPlugin.configs['flat/recommended']]
