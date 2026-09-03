# users module (scaffolded, not yet implemented)

User profile CRUD (the onboarding wizard's ~40 fields: personal info, goals, health questions, equipment, measurements snapshot). Auth module owns identity (email/role/session); this module owns the fitness profile, referenced by userId.

Follow the auth module's layering when building this out:
```
users.routes.ts -> users.controller.ts -> users.service.ts -> users.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
