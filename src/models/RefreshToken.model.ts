import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * One document per issued refresh token. Storing them (instead of trusting
 * the JWT alone) is what makes logout, rotation, and "revoke all sessions"
 * possible — a bare stateless JWT can't be invalidated before it expires.
 */
const refreshTokenSchema = new Schema(
  {
    uuid: { type: String, default: uuidv4, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true }, // never store the raw token
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: String, default: null }, // set on rotation
  },
  { timestamps: true }
)

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema>
export const RefreshToken = model('RefreshToken', refreshTokenSchema)
