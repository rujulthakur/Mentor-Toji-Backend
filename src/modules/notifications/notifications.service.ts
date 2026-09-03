import { NotFoundError } from '../../utils/ApiError.js'
import { notificationsRepository } from './notifications.repository.js'

export const notificationsService = {
  list(userId: string, page: number, limit: number) {
    return notificationsRepository.find(userId, page, limit)
  },

  async markRead(userId: string, id: string) {
    const n = await notificationsRepository.markRead(userId, id)
    if (!n) throw new NotFoundError('Notification not found')
    return n
  },

  markAllRead(userId: string) {
    return notificationsRepository.markAllRead(userId)
  },

  async remove(userId: string, id: string) {
    await notificationsRepository.remove(userId, id)
  },
}
