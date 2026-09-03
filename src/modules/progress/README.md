# progress module (scaffolded, not yet implemented)

Aggregation layer over workouts + measurements: volume trends, strength progression, frequency heatmap, consistency score. Mostly read/aggregate -- a good candidate for Redis caching with short TTLs.

Follow the auth module's layering when building this out:
```
progress.routes.ts -> progress.controller.ts -> progress.service.ts -> progress.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
