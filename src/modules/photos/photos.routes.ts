import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { upload } from '../../config/multer.js'
import { photosController } from './photos.controller.js'
import { uploadPhotoBodySchema, listPhotosQuerySchema, photoIdParamSchema } from './photos.validators.js'

export const photosRouter = Router()

photosRouter.use(authenticate)

photosRouter.get('/', validate({ query: listPhotosQuerySchema }), photosController.list)
photosRouter.post('/', upload.single('photo'), validate({ body: uploadPhotoBodySchema }), photosController.upload)
photosRouter.delete('/:id', validate({ params: photoIdParamSchema }), photosController.remove)
