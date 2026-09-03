import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const chatMessageSchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    tokenUsage: { type: Number },
    /** Snapshot of the profile/workout/measurement context sent to Grok alongside this message, for full recoverability. */
    contextSnapshot: { type: Schema.Types.Mixed },
  },
  { _id: false }
)

const chatConversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation' },
    pinned: { type: Boolean, default: false },
    messages: { type: [chatMessageSchema], default: [] },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

chatConversationSchema.index({ userId: 1, updatedAt: -1 })

export type ChatConversationDocument = InferSchemaType<typeof chatConversationSchema>
export const ChatConversation = model('ChatConversation', chatConversationSchema)
