# settings module (scaffolded, not yet implemented)

Units (kg/lbs, cm/inch), notification preferences, AI settings, theme. Small key-value-ish profile-adjacent collection.

Follow the auth module's layering when building this out:
```
settings.routes.ts -> settings.controller.ts -> settings.service.ts -> settings.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
