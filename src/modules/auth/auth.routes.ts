import { Router } from 'express'
import { authController } from './auth.controller.js'
import { validate } from '../../middlewares/validate.js'
import { sendOtpSchema, verifyOtpSchema, googleLoginSchema } from './auth.validators.js'
import { otpSendRateLimiter, otpVerifyRateLimiter } from '../../middlewares/otpRateLimiter.js'

export const authRouter = Router()

authRouter.post('/send-otp', validate({ body: sendOtpSchema }), otpSendRateLimiter, authController.sendOtp)
authRouter.post('/verify-otp', validate({ body: verifyOtpSchema }), otpVerifyRateLimiter, authController.verifyOtp)
authRouter.post('/google', validate({ body: googleLoginSchema }), authController.googleLogin)
authRouter.get('/verify', authController.verifySession)
authRouter.post('/logout', authController.logout)
