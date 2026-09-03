import { z } from 'zod'

export const searchUsersQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search term is required').max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const userIdParamSchema = z.object({
  userId: z.string().min(1),
})

export const requestIdParamSchema = z.object({
  requestId: z.string().min(1),
})

export const sendFriendRequestSchema = z.object({
  addresseeId: z.string().min(1, 'addresseeId is required'),
})

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>
