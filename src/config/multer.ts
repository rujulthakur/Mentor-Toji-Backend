import multer from 'multer'
import { env } from './env.js'
import { ValidationError } from '../utils/ApiError.js'

const IMAGE_EXTENSION_RE = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i

/**
 * In-memory storage — files are streamed straight to Cloudinary
 * (see modules/photos/photos.service.ts) and never touch local disk,
 * which matters for a stateless/horizontally-scaled deployment.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  // Configurable via PHOTO_UPLOAD_MAX_MB (defaults to a generous 50MB —
  // see env.ts) instead of a hardcoded, restrictive cap. The old 15MB
  // ceiling still rejected some legitimate high-res progress photos; with
  // very few users right now there's no cost reason to be strict, so this
  // is intentionally loose. A basic ceiling is still kept (not literally
  // unlimited) so a malformed/huge request body can't crash the server.
  limits: { fileSize: env.PHOTO_UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Some mobile browsers report HEIC/HEIF photos (or ones picked via
    // "Files"/cloud pickers) with a generic mimetype like
    // application/octet-stream instead of image/*. Fall back to the file
    // extension so a real photo isn't rejected just because the browser
    // guessed its type wrong — Cloudinary itself accepts all these formats.
    const looksLikeImage = file.mimetype.startsWith('image/') || IMAGE_EXTENSION_RE.test(file.originalname)
    if (!looksLikeImage) {
      return cb(new ValidationError('Only image files are allowed'))
    }
    cb(null, true)
  },
})
