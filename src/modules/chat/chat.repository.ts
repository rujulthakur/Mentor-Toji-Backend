import { ChatConversation } from '../../models/ChatConversation.model.js'
import type { ListConversationsQuery } from './chat.validators.js'

export const chatRepository = {
  create(userId: string, title: string) {
    return ChatConversation.create({ userId, title, messages: [] })
  },

  findById(userId: string, id: string) {
    return ChatConversation.findOne({ _id: id, userId, deletedAt: null })
  },

  async find(userId: string, query: ListConversationsQuery) {
    const filter = { userId, deletedAt: null }
    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      ChatConversation.find(filter)
        .sort({ pinned: -1, updatedAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .select('-messages') // list view never needs full message bodies
        .lean(),
      ChatConversation.countDocuments(filter),
    ])
    return { items, total, page: query.page, limit: query.limit }
  },

  appendMessages(id: string, messages: unknown[]) {
    return ChatConversation.findByIdAndUpdate(id, { $push: { messages: { $each: messages } } }, { new: true })
  },

  setPinned(userId: string, id: string, pinned: boolean) {
    return ChatConversation.findOneAndUpdate({ _id: id, userId }, { $set: { pinned } }, { new: true })
  },

  softDelete(userId: string, id: string) {
    return ChatConversation.updateOne({ _id: id, userId }, { deletedAt: new Date() })
  },
}
