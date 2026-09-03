# exercises module (scaffolded, not yet implemented)

Master exercise database (500+ entries). Read-heavy -- cache the full list and common filters (by muscle/equipment/movement pattern) in Redis; invalidate on admin edits only.

Follow the auth module's layering when building this out:
```
exercises.routes.ts -> exercises.controller.ts -> exercises.service.ts -> exercises.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
