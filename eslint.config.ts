import { tanstackConfig } from '@tanstack/eslint-config'
import queryPlugin from '@tanstack/eslint-plugin-query'

export default [
  {
    ignores: [
      '.netlify/**',
      './src/integrations/supabase/database.types.ts',
      'playwright-report/**',
      'styled-system/**',
    ],
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
  {
    files: ['src/routes/(public)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/integrations/supabase/user',
              message:
                'Do not use the user Supabase client in public page routes. Use public APIs/client instead.',
            },
            {
              name: '@/integrations/supabase/user.hooks',
              message:
                'Do not use the user Supabase client in public page routes. Use public APIs/client instead.',
            },
            {
              name: '@/lib/guards',
              importNames: ['requireAuthenticated'],
              message: 'Public routes must not import authenticated guards.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'PRIVATE_DOCUMENT_CACHE_CONTROL',
                'getPrivateDocumentCacheControlHeader',
              ],
              message:
                'Public routes must not use private/authenticated policy helpers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/(private)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/route-policy',
              importNames: [
                'PUBLIC_DOCUMENT_CACHE_CONTROL',
                'getPublicDocumentCacheControlHeader',
              ],
              message:
                'Private routes must not use public cache/policy helpers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/(token-callbacks)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/components/ui/forms',
              message:
                'Token-callback routes should be server handlers and must not depend on UI components.',
            },
            {
              name: '@/components/ui/link',
              message:
                'Token-callback routes should be server handlers and must not depend on UI components.',
            },
            {
              name: '@/features/auth/hooks/use-auth-commands',
              message:
                'Token-callback routes must not use client auth commands.',
            },
            {
              name: '@/integrations/supabase/user.hooks',
              message:
                'Token-callback routes must not depend on user-supabase client hooks.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'PUBLIC_DOCUMENT_CACHE_CONTROL',
                'PRIVATE_DOCUMENT_CACHE_CONTROL',
                'getPublicDocumentCacheControlHeader',
                'getPrivateDocumentCacheControlHeader',
              ],
              message:
                'Token-callback route policy is inherited from /(token-callbacks)/route.tsx; do not override in descendants.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.value='Cache-Control'][value.type='Literal']",
          message:
            'Do not use Cache-Control string literals in route files. Use route-policy helper functions instead.',
        },
        {
          selector: "Property[key.value='cache-control'][value.type='Literal']",
          message:
            'Do not use cache-control string literals in route files. Use route-policy helper functions instead.',
        },
        {
          selector: 'Property[key.value=/^(?:netlify-)?cdn-cache-control$/i]',
          message:
            'Do not set CDN cache-control headers directly in route files. Use route-policy helper functions instead.',
        },
      ],
    },
  },
]
