import { ApiError } from '../../utils/ApiError.js'
import { friendsRepository } from './friends.repository.js'
import { computeUserStats, currentWeightFromProfile, type CommunityStats } from './friends.stats.js'
import type { ProfileDocument } from '../../models/Profile.model.js'

type VisibilityLevel = 'public' | 'friends' | 'private'
type Privacy = NonNullable<ProfileDocument['privacy']>

const DEFAULT_PRIVACY: Record<keyof Privacy, VisibilityLevel> = {
  weight: 'friends',
  streak: 'public',
  workoutStats: 'friends',
  volumeStats: 'friends',
  nutritionStatus: 'friends',
  growthScore: 'public',
}

function fieldVisible(level: VisibilityLevel | undefined, isFriend: boolean, isSelf: boolean): boolean {
  if (isSelf) return true
  if (level === 'private' || !level) return false
  if (level === 'public') return true
  return isFriend // 'friends'
}

function toUserSummary(user: {
  _id: unknown
  name?: string | null
  email: string
  avatarUrl?: string | null
}) {
  return {
    id: String(user._id),
    name: user.name ?? user.email.split('@')[0],
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
  }
}

/** Applies a profile's privacy settings to a raw stats bundle for a viewer. */
function redactStats(
  stats: CommunityStats,
  privacy: Partial<Privacy> | undefined,
  isFriend: boolean,
  isSelf: boolean
): CommunityStats {
  const p = { ...DEFAULT_PRIVACY, ...privacy }
  return {
    currentWeightKg: fieldVisible(p.weight, isFriend, isSelf) ? stats.currentWeightKg : null,
    streak: fieldVisible(p.streak, isFriend, isSelf) ? stats.streak : null,
    totalWorkoutDurationMinutes: fieldVisible(p.workoutStats, isFriend, isSelf)
      ? stats.totalWorkoutDurationMinutes
      : null,
    totalVolumeToday: fieldVisible(p.volumeStats, isFriend, isSelf) ? stats.totalVolumeToday : null,
    totalVolumeAllTime: fieldVisible(p.volumeStats, isFriend, isSelf) ? stats.totalVolumeAllTime : null,
    nutritionLoggingConsistencyPct: fieldVisible(p.nutritionStatus, isFriend, isSelf)
      ? stats.nutritionLoggingConsistencyPct
      : null,
    growthScore: fieldVisible(p.growthScore, isFriend, isSelf) ? stats.growthScore : null,
  }
}

async function isFriendOf(currentUserId: string, otherUserId: string): Promise<boolean> {
  const rel = await friendsRepository.findBetween(currentUserId, otherUserId)
  return rel?.status === 'accepted'
}

export const friendsService = {
  async searchUsers(currentUserId: string, q: string, page: number, limit: number) {
    const { items, total, limit: pageSize } = await friendsRepository.searchUsers(currentUserId, q, page, limit)
    if (items.length === 0) return { items: [], total, page, limit: pageSize }

    const otherIds = items.map((u) => String(u._id))
    const relationships = await friendsRepository.findManyBetween(currentUserId, otherIds)
    const relByOtherId = new Map(
      relationships.map((r) => {
        const otherId = String(r.requesterId) === currentUserId ? String(r.addresseeId) : String(r.requesterId)
        return [otherId, r]
      })
    )

    const results = items.map((u) => {
      const id = String(u._id)
      const rel = relByOtherId.get(id)
      const status = rel?.status ?? 'none'
      return {
        ...toUserSummary(u),
        friendshipStatus: status,
        friendshipId: rel ? String(rel._id) : null,
        incoming: rel ? rel.status === 'pending' && String(rel.addresseeId) === currentUserId : false,
      }
    })

    return { items: results, total, page, limit: pageSize }
  },

  async sendRequest(currentUserId: string, addresseeId: string) {
    if (currentUserId === addresseeId) {
      throw new ApiError(400, 'You cannot send a friend request to yourself')
    }
    const addressee = await friendsRepository.findUserById(addresseeId)
    if (!addressee) throw new ApiError(404, 'User not found')

    const existing = await friendsRepository.findBetween(currentUserId, addresseeId)
    if (existing) {
      if (existing.status === 'accepted') throw new ApiError(409, 'You are already friends with this user')
      if (existing.status === 'pending') throw new ApiError(409, 'A friend request is already pending')
      // Previously rejected — allow a fresh request by removing the old record.
      await friendsRepository.deleteById(String(existing._id))
    }

    const request = await friendsRepository.createRequest(currentUserId, addresseeId)
    return { id: String(request._id), status: request.status, createdAt: request.createdAt }
  },

  async acceptRequest(currentUserId: string, requestId: string) {
    const request = await friendsRepository.findById(requestId)
    if (!request) throw new ApiError(404, 'Friend request not found')
    if (String(request.addresseeId) !== currentUserId) {
      throw new ApiError(403, 'You are not authorized to respond to this request')
    }
    if (request.status !== 'pending') throw new ApiError(409, 'This request has already been resolved')

    const updated = await friendsRepository.setStatus(requestId, 'accepted')
    return updated
  },

  async rejectRequest(currentUserId: string, requestId: string) {
    const request = await friendsRepository.findById(requestId)
    if (!request) throw new ApiError(404, 'Friend request not found')
    if (String(request.addresseeId) !== currentUserId) {
      throw new ApiError(403, 'You are not authorized to respond to this request')
    }
    if (request.status !== 'pending') throw new ApiError(409, 'This request has already been resolved')

    const updated = await friendsRepository.setStatus(requestId, 'rejected')
    return updated
  },

  async removeFriend(currentUserId: string, friendUserId: string) {
    const rel = await friendsRepository.findBetween(currentUserId, friendUserId)
    if (!rel || rel.status !== 'accepted') throw new ApiError(404, 'Friendship not found')
    await friendsRepository.deleteById(String(rel._id))
    return { removed: true }
  },

  async listFriends(currentUserId: string) {
    const relationships = await friendsRepository.listAccepted(currentUserId)
    if (relationships.length === 0) return []

    const friendIds = relationships.map((r) =>
      String(r.requesterId) === currentUserId ? String(r.addresseeId) : String(r.requesterId)
    )
    const [users, profiles] = await Promise.all([
      friendsRepository.findUsersByIds(friendIds),
      friendsRepository.findProfilesByUserIds(friendIds),
    ])
    const userById = new Map(users.map((u) => [String(u._id), u]))
    const profileById = new Map(profiles.map((p) => [String(p.userId), p]))

    const results = await Promise.all(
      relationships.map(async (rel) => {
        const friendId = String(rel.requesterId) === currentUserId ? String(rel.addresseeId) : String(rel.requesterId)
        const user = userById.get(friendId)
        if (!user) return null
        const profile = profileById.get(friendId) ?? null
        const rawStats = await computeUserStats(friendId)
        rawStats.currentWeightKg = currentWeightFromProfile(profile)
        const stats = redactStats(rawStats, profile?.privacy, true, false)
        return {
          friendshipId: String(rel._id),
          user: toUserSummary(user),
          since: rel.respondedAt ?? rel.updatedAt,
          stats,
        }
      })
    )
    return results.filter((r): r is NonNullable<typeof r> => r !== null)
  },

  async listIncoming(currentUserId: string) {
    const relationships = await friendsRepository.listIncoming(currentUserId)
    if (relationships.length === 0) return []
    const users = await friendsRepository.findUsersByIds(relationships.map((r) => String(r.requesterId)))
    const userById = new Map(users.map((u) => [String(u._id), u]))
    return relationships
      .map((r) => {
        const user = userById.get(String(r.requesterId))
        if (!user) return null
        return { id: String(r._id), user: toUserSummary(user), createdAt: r.createdAt }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  },

  async listOutgoing(currentUserId: string) {
    const relationships = await friendsRepository.listOutgoing(currentUserId)
    if (relationships.length === 0) return []
    const users = await friendsRepository.findUsersByIds(relationships.map((r) => String(r.addresseeId)))
    const userById = new Map(users.map((u) => [String(u._id), u]))
    return relationships
      .map((r) => {
        const user = userById.get(String(r.addresseeId))
        if (!user) return null
        return { id: String(r._id), user: toUserSummary(user), createdAt: r.createdAt }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  },

  /** Own stats — never redacted, since privacy only governs what *other* people see. */
  async getOwnCommunityStats(userId: string) {
    const profile = await friendsRepository.findProfileByUserId(userId)
    const stats = await computeUserStats(userId)
    stats.currentWeightKg = currentWeightFromProfile(profile)
    return stats
  },

  async getPublicProfile(currentUserId: string, targetUserId: string) {
    const user = await friendsRepository.findUserById(targetUserId)
    if (!user) throw new ApiError(404, 'User not found')

    const isSelf = currentUserId === targetUserId
    const isFriend = isSelf ? true : await isFriendOf(currentUserId, targetUserId)

    const profile = await friendsRepository.findProfileByUserId(targetUserId)
    const rawStats = await computeUserStats(targetUserId)
    rawStats.currentWeightKg = currentWeightFromProfile(profile)
    const stats = redactStats(rawStats, profile?.privacy, isFriend, isSelf)

    return { user: toUserSummary(user), stats }
  },
}
