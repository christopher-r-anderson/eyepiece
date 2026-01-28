import { tanstackConfig } from '@tanstack/eslint-config'
import queryPlugin from '@tanstack/eslint-plugin-query'

export default [
  {
    ignores: ['.netlify/**'],
  },
  ...tanstackConfig,
  ...queryPlugin.configs['flat/recommended'],
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useId'],
              message: 'Import useId from "react-aria" instead of "react".',
            },
            {
              name: 'react-aria-components',
              message:
                'Import from our UI layer (e.g. "@/components/ui/forms") instead of directly from react-aria-components.',
            },
          ],
          patterns: [
            {
              group: ['react-aria-components/*'],
              message:
                'Import from our UI layer (e.g. "@/components/ui/forms") instead of directly from react-aria-components.',
            },
            {
              group: [
                '../**/components/ui',
                '../**/components/ui/*',
                './**/components/ui',
                './**/components/ui/*',
              ],
              message:
                'Import UI via "@/components/ui/…" instead of relative paths.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/integrations/react-aria-components/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
