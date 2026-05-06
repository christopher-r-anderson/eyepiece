import { tanstackConfig } from '@tanstack/eslint-config'
import queryPlugin from '@tanstack/eslint-plugin-query'

export default [
  {
    ignores: [
      '.netlify/**',
      './src/integrations/supabase/database.types.ts',
      'playwright-report/**',
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
              name: '@/integrations/supabase/providers/user-provider',
              message:
                'Do not use user-supabase provider hooks in public page routes.',
            },
            {
              name: '@/lib/guards',
              importNames: [
                'requireAuthenticatedShell',
                'requireAuthenticatedRoute',
              ],
              message: 'Public routes must not import authenticated guards.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'AUTHENTICATED_ROUTE_POLICY',
                'PRIVATE_ANONYMOUS_ROUTE_POLICY',
                'PRIVATE_DOCUMENT_CACHE_CONTROL',
                'getPrivateDocumentCacheControlHeader',
                'requireUserSupabaseClient',
              ],
              message:
                'Public routes must not use private/authenticated policy helpers.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "ObjectPattern > Property[key.name='userSupabaseClient']",
          message:
            'Do not access userSupabaseClient in public page routes; user auth data access belongs in authenticated route subtrees.',
        },
        {
          selector: "MemberExpression[property.name='userSupabaseClient']",
          message:
            'Do not access userSupabaseClient in public page routes; user auth data access belongs in authenticated route subtrees.',
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
                'PUBLIC_ROUTE_POLICY',
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
              name: '@/features/auth/auth.commands-provider',
              message:
                'Token-callback routes must not mount client auth command providers.',
            },
            {
              name: '@/integrations/supabase/providers/user-provider',
              message:
                'Token-callback routes must not depend on user-supabase provider hooks.',
            },
            {
              name: '@/lib/route-policy',
              importNames: [
                'PUBLIC_ROUTE_POLICY',
                'AUTHENTICATED_ROUTE_POLICY',
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
    ignores: [
      'src/lib/route-policy.ts',
      // The (private) shell legitimately reads userSupabaseClient to pass to UserSupabaseClientProvider.
      // Access is guarded by requireAuthenticatedShell in authenticatedBoundary.
      'src/routes/(private)/route.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "ObjectPattern > Property[key.name='userSupabaseClient']",
          message:
            'Route loaders should use requireUserSupabaseClient(context) from @/lib/route-policy to enforce route policy checks.',
        },
        {
          selector: "MemberExpression[property.name='userSupabaseClient']",
          message:
            'Route loaders should use requireUserSupabaseClient(context) from @/lib/route-policy to enforce route policy checks.',
        },
        {
          selector: "Property[key.name='routePolicy']",
          message:
            'Do not set routePolicy in descendant route files. Route policy must be defined at policy root boundaries.',
        },
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
      ],
    },
  },
]
