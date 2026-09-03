import { cloudinary } from '../../config/cloudinary.js'
import { CloudinaryError, NotFoundError } from '../../utils/ApiError.js'
import { photosRepository } from './photos.repository.js'
import { buildImageVariants } from './imageVariants.js'
import type { UploadPhotoBody } from './photos.validators.js'

const UPLOAD_TIMEOUT_MS = 20_000

function uploadBuffer(buffer: Buffer, folder: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    // Without a timeout, a stalled/unreachable Cloudinary connection (bad
    // credentials, network block, DNS issue) leaves this promise pending
    // forever — Express never sends a response, and the request just hangs
    // until something in front of the server (a proxy, tunnel, or Docker/
    // WSL2's port forwarding) times it out itself, which surfaces to the
    // browser as an opaque 502 with nothing in our own logs to explain it.
    const timer = setTimeout(() => {
      reject(new Error(`Cloudinary upload timed out after ${UPLOAD_TIMEOUT_MS}ms`))
    }, UPLOAD_TIMEOUT_MS)

    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      clearTimeout(timer)
      if (err || !result) return reject(err)
      resolve({ secure_url: result.secure_url, public_id: result.public_id })
    })
    stream.end(buffer)
  })
}

/**
 * Attaches ready-to-use, mobile-optimized asset URLs (avatar crop,
 * thumbnail, card, hero banners, general mobile UI) to a photo doc.
 * Cheap — these are just derived Cloudinary URLs, computed on read,
 * never stored, so existing documents (uploaded before this existed)
 * get variants automatically without any migration.
 */
function withVariants<T extends { url: string; cloudinaryPublicId?: string | null }>(
  photo: T
): T & { variants: ReturnType<typeof buildImageVariants> | null } {
  if (!photo.cloudinaryPublicId) return { ...photo, variants: null }
  return { ...photo, variants: buildImageVariants(photo.cloudinaryPublicId, photo.url) }
}

export const photosService = {
  async upload(userId: string, file: Express.Multer.File, body: UploadPhotoBody) {
    let uploaded: { secure_url: string; public_id: string }
    try {
      uploaded = await uploadBuffer(file.buffer, `gymtracker/${userId}/progress-photos`)
    } catch (err) {
      // Logged with detail server-side (Cloudinary's real error, or the
      // timeout above) even though the client only gets a generic message —
      // this is the line to check in your terminal the next time an upload
      // fails, since the client-facing error deliberately doesn't leak it.
      // eslint-disable-next-line no-console
      console.error('[photos] Cloudinary upload failed:', err)
      throw new CloudinaryError('Photo upload failed')
    }

    const photo = await photosRepository.create(userId, {
      date: new Date(body.date),
      angle: body.angle,
      url: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      weightKg: body.weightKg,
      bodyFatPct: body.bodyFatPct,
      notes: body.notes,
    })
    return withVariants(photo.toObject())
  },

  async list(userId: string, query: Parameters<typeof photosRepository.find>[1]) {
    const result = await photosRepository.find(userId, query)
    return { ...result, items: result.items.map(withVariants) }
  },

  async delete(userId: string, id: string) {
    const photo = await photosRepository.findById(userId, id)
    if (!photo) throw new NotFoundError('Photo not found')
    if (photo.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(photo.cloudinaryPublicId)
      } catch {
        // Cloudinary cleanup failing shouldn't block the user from removing the record.
      }
    }
    await photosRepository.softDelete(userId, id)
  },
}
