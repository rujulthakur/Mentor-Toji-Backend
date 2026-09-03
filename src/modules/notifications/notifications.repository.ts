import { Notification } from '../../models/Notification.model.js'

export const notificationsRepository = {
  create(userId: string, data: { type: string; title: string; message: string }) {
    return Notification.create({ ...data, userId })
  },

  async find(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit
    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ])
    return { items, total, page, limit, unreadCount }
  },

  markRead(userId: string, id: string) {
    return Notification.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true })
  },

  markAllRead(userId: string) {
    return Notification.updateMany({ userId, read: false }, { $set: { read: true } })
  },

  remove(userId: string, id: string) {
    return Notification.deleteOne({ _id: id, userId })
  },
}
