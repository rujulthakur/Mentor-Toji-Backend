import { cloudinary } from '../../config/cloudinary.js'

/**
 * Generates the standard set of derived asset URLs a mobile-first UI
 * needs from a single uploaded image, using Cloudinary's on-the-fly
 * transformation API rather than processing images ourselves in Node.
 * That keeps this stateless/horizontally-scaled Render service from
 * having to do CPU-heavy image work (or ship a native image library),
 * while still giving the frontend production-ready, pre-cropped,
 * pre-optimized assets for every place a photo shows up.
 *
 * Every variant is requested as PNG (transparency-preserving) and
 * Cloudinary caches each derived version the first time it's actually
 * requested, so calling this doesn't do any extra upload/processing work
 * up front — it just builds URLs.
 */

export interface ImageVariantSet {
  original: string
  avatar: string // 128x128 square face-aware crop — profile/nav avatars
  thumbnail: string // 96x96 square crop — list rows, small previews
  card: string // 400x400 square, fit — grid cards
  heroWide: string // 1200x675 (16:9), fit — hero banners / feature cards
  heroTall: string // 750x1000 (3:4), fit — mobile full-bleed hero
  mobileUi: string // 640x360, fit — general mobile UI asset
}

function variantUrl(publicId: string, transformation: Record<string, unknown>): string {
  return cloudinary.url(publicId, {
    transformation: [transformation],
    format: 'png',
    secure: true,
  })
}

export function buildImageVariants(publicId: string, originalUrl: string): ImageVariantSet {
  return {
    original: originalUrl,
    avatar: variantUrl(publicId, { width: 128, height: 128, crop: 'thumb', gravity: 'face', radius: 'max' }),
    thumbnail: variantUrl(publicId, { width: 96, height: 96, crop: 'thumb', gravity: 'auto' }),
    card: variantUrl(publicId, { width: 400, height: 400, crop: 'fill', gravity: 'auto' }),
    heroWide: variantUrl(publicId, { width: 1200, height: 675, crop: 'fill', gravity: 'auto' }),
    heroTall: variantUrl(publicId, { width: 750, height: 1000, crop: 'fill', gravity: 'auto' }),
    mobileUi: variantUrl(publicId, { width: 640, height: 360, crop: 'fill', gravity: 'auto' }),
  }
}
