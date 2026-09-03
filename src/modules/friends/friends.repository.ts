import { User } from '../../models/User.model.js'
import { Profile } from '../../models/Profile.model.js'
import { Friendship } from '../../models/Friendship.model.js'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const friendsRepository = {
  async searchUsers(currentUserId: string, q: string, page: number, limit: number) {
    const regex = new RegExp(escapeRegex(q), 'i')
    const filter = {
      _id: { $ne: currentUserId },
      deletedAt: null,
      $or: [{ name: regex }, { email: regex }],
    }
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      User.find(filter).select('name email avatarUrl').sort({ name: 1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    return { items, total, page, limit }
  },

  findUserById(id: string) {
    return User.findOne({ _id: id, deletedAt: null }).select('name email avatarUrl').lean()
  },

  findUsersByIds(ids: string[]) {
    return User.find({ _id: { $in: ids }, deletedAt: null }).select('name email avatarUrl').lean()
  },

  findProfileByUserId(userId: string) {
    return Profile.findOne({ userId }).lean()
  },

  findProfilesByUserIds(ids: string[]) {
    return Profile.find({ userId: { $in: ids } }).lean()
  },

  /** Any relationship between the two users, regardless of who sent it. */
  findBetween(userA: string, userB: string) {
    return Friendship.findOne({
      $or: [
        { requesterId: userA, addresseeId: userB },
        { requesterId: userB, addresseeId: userA },
      ],
    })
  },

  findManyBetween(currentUserId: string, otherUserIds: string[]) {
    return Friendship.find({
      $or: [
        { requesterId: currentUserId, addresseeId: { $in: otherUserIds } },
        { addresseeId: currentUserId, requesterId: { $in: otherUserIds } },
      ],
    }).lean()
  },

  createRequest(requesterId: string, addresseeId: string) {
    return Friendship.create({ requesterId, addresseeId, status: 'pending' })
  },

  findById(id: string) {
    return Friendship.findById(id)
  },

  setStatus(id: string, status: 'accepted' | 'rejected') {
    return Friendship.findByIdAndUpdate(id, { status, respondedAt: new Date() }, { new: true })
  },

  deleteById(id: string) {
    return Friendship.deleteOne({ _id: id })
  },

  listAccepted(userId: string) {
    return Friendship.find({ status: 'accepted', $or: [{ requesterId: userId }, { addresseeId: userId }] })
      .sort({ respondedAt: -1 })
      .lean()
  },

  listIncoming(userId: string) {
    return Friendship.find({ addresseeId: userId, status: 'pending' }).sort({ createdAt: -1 }).lean()
  },

  listOutgoing(userId: string) {
    return Friendship.find({ requesterId: userId, status: 'pending' }).sort({ createdAt: -1 }).lean()
  },

  countAcceptedFriends(userId: string) {
    return Friendship.countDocuments({ status: 'accepted', $or: [{ requesterId: userId }, { addresseeId: userId }] })
  },
}
