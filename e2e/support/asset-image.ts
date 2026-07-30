// e2e stubs carry a single-entry ladder: the journeys exercise layout and
// navigation, not rendition selection
export function singleRenditionImage(
  href: string,
  width: number,
  height: number,
) {
  return { width, height, renditions: [{ href, width, height }] }
}

export function snapshotImageColumns(
  href: string,
  width: number,
  height: number,
) {
  return {
    image_width: width,
    image_height: height,
    renditions: [{ href, width, height }],
  }
}
