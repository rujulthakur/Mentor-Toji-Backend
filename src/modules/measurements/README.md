# measurements module (scaffolded, not yet implemented)

Body measurement history (weight, body fat, circumferences) as its own time-series collection, separate from workouts so progress charts can query it directly.

Follow the auth module's layering when building this out:
```
measurements.routes.ts -> measurements.controller.ts -> measurements.service.ts -> measurements.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
