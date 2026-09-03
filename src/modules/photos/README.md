# photos module (scaffolded, not yet implemented)

Progress photo uploads via Multer + Cloudinary (config already wired in src/config/cloudinary.ts). Store only the Cloudinary URLs + metadata in Mongo, never the binary.

Follow the auth module's layering when building this out:
```
photos.routes.ts -> photos.controller.ts -> photos.service.ts -> photos.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
