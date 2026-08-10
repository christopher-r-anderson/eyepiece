// Shared by the app's delivery-URL builder and the Netlify edge function,
// which is bundled for Deno - this module must stay dependency-free.
export const NASA_IMAGE_HREF_PREFIX = 'https://images-assets.nasa.gov/'
export const NASA_IMAGE_SOURCE_PREFIX = '/img/nasa'
// IIIF urls only: labelled-resource fallbacks (ids/download, ids/delivery)
// stay direct
export const SI_IMAGE_HREF_PREFIX = 'https://ids.si.edu/ids/iiif/'

// browsers do not decode TIFF, which NASA serves as the original on about a
// tenth of its records
export const UNDECODABLE_IMAGE_PATTERN = /\.tiff?($|\?)/i

// headroom over the ladder's 3MB cap on NASA originals
export const NASA_IMAGE_SOURCE_MAX_BYTES = 4 * 1024 * 1024
