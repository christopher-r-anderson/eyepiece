import { createFileRoute } from '@tanstack/react-router'
import { buildPublicApiCacheMiddleware } from '@/server/lib/middleware'
import { createPublicSupabaseClient } from '@/integrations/supabase/public'
import { makeCollectionsRepo } from '@/features/collections/collections.repo'
import { FEATURED_ALBUMS } from '@/features/home/home.curation'
import { getOrigin } from '@/lib/utils'
import { unwrapOrThrow } from '@/lib/result'

const publicApiCacheMiddleware = buildPublicApiCacheMiddleware()

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// the homepage, the curated albums, and every public collection; auth pages
// are utility and the search page is noindexed, so neither belongs here
export const Route = createFileRoute('/(public)/sitemap.xml')({
  server: {
    middleware: [publicApiCacheMiddleware],
    handlers: {
      GET: async () => {
        const repo = makeCollectionsRepo(createPublicSupabaseClient())
        const collectionIds = unwrapOrThrow(
          await repo.listPublicCollectionIds(),
        )

        const paths = [
          '/',
          ...FEATURED_ALBUMS.map(
            ({ albumKey }) =>
              `/albums/${encodeURIComponent(albumKey.providerId)}/${encodeURIComponent(albumKey.externalId)}`,
          ),
          ...collectionIds.map((id) => `/collections/${id}`),
        ]

        const origin = getOrigin()
        const urls = paths
          .map(
            (path) =>
              `  <url><loc>${xmlEscape(`${origin}${path}`)}</loc></url>`,
          )
          .join('\n')

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          { headers: { 'content-type': 'application/xml' } },
        )
      },
    },
  },
})
