// Shared by the app's delivery-URL builder and the Netlify edge function,
// which is bundled for Deno - this module must stay dependency-free.
export const NASA_IMAGE_HREF_PREFIX = 'https://images-assets.nasa.gov/'
export const NASA_IMAGE_SOURCE_PREFIX = '/img/nasa'
// IIIF cuts only: records without an idsId fall back to labelled resource
// urls (ids/download, ids/delivery) that the allowlist does not admit -
// those stay direct
export const SI_IMAGE_HREF_PREFIX = 'https://ids.si.edu/ids/iiif/'

// browsers do not decode TIFF, and NASA serves one as the original on about
// a tenth of its records; the app's ladders exclude them, so the edge
// function rejecting them turns away only abusive callers
export const UNDECODABLE_IMAGE_PATTERN = /\.tiff?($|\?)/i

// the app never emits a rendition above the 3MB original cap; anything
// larger reaching the same-site source is not our traffic
export const NASA_IMAGE_SOURCE_MAX_BYTES = 4 * 1024 * 1024
