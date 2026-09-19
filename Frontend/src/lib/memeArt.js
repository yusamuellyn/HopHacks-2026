const files = import.meta.glob('../assets/memes/*.{png,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
})

function fileKey(path) {
  return path.split('/').pop().replace(/\.(png|webp|jpe?g)$/i, '').toLowerCase()
}

const BY_NAME = Object.fromEntries(Object.entries(files).map(([path, src]) => [fileKey(path), src]))

export function memePhoto(meme) {
  if (!meme) return null
  return (
    BY_NAME[meme.id] ||
    BY_NAME[meme.sigil] ||
    BY_NAME[String(meme.name || '').toLowerCase().replace(/\s+/g, '-')] ||
    null
  )
}
