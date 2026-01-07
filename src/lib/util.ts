export const NOT_FOUND_IMAGE = {
  // A 1x1 transparent GIF
  href: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  width: 640,
  height: 480,
}

export const getTitleText = (title: string | undefined) => {
  return title
    ? `${title} | eyepiece: NASA Media Explorer`
    : 'eyepiece: NASA Media Explorer'
}
