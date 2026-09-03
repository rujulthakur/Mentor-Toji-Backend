import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { friendsController } from './friends.controller.js'
import {
  searchUsersQuerySchema,
  sendFriendRequestSchema,
  requestIdParamSchema,
  userIdParamSchema,
} from './friends.validators.js'

export const friendsRouter = Router()

friendsRouter.use(authenticate)

// Discovery
friendsRouter.get('/search', validate({ query: searchUsersQuerySchema }), friendsController.searchUsers)

// Requests
friendsRouter.post('/requests', validate({ body: sendFriendRequestSchema }), friendsController.sendRequest)
friendsRouter.post(
  '/requests/:requestId/accept',
  validate({ params: requestIdParamSchema }),
  friendsController.acceptRequest
)
friendsRouter.post(
  '/requests/:requestId/reject',
  validate({ params: requestIdParamSchema }),
  friendsController.rejectRequest
)
friendsRouter.get('/requests/incoming', friendsController.listIncoming)
friendsRouter.get('/requests/outgoing', friendsController.listOutgoing)

// Friends list & management
friendsRouter.get('/', friendsController.listFriends)
friendsRouter.delete('/:userId', validate({ params: userIdParamSchema }), friendsController.removeFriend)

// Community stats / public profiles
friendsRouter.get('/stats/me', friendsController.getOwnCommunityStats)
friendsRouter.get('/:userId/profile', validate({ params: userIdParamSchema }), friendsController.getPublicProfile)
