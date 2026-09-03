import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * A single relationship document between two users, directional at
 * creation time (requester -> addressee) but symmetric once accepted.
 * The service layer always queries both directions (see
 * friends.repository.ts `findBetween`) so callers never have to think
 * about which side of the pair they're on.
 *
 * Kept intentionally small — no denormalized user data here — so it
 * scales cleanly past the "1-10 friends" first-version scope without a
 * migration; profile/stat data is always joined at read time.
 */
const friendshipSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Prevents a duplicate request in the exact same direction; the service
// layer also checks the reverse direction before creating, since Mongo
// can't express "unique regardless of field order" in a single index.
friendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true })
friendshipSchema.index({ addresseeId: 1, status: 1 })
friendshipSchema.index({ requesterId: 1, status: 1 })

export type FriendshipDocument = InferSchemaType<typeof friendshipSchema>
export const Friendship = model('Friendship', friendshipSchema)
