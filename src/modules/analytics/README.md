# analytics module (scaffolded, not yet implemented)

Dashboard analytics service: weekly/monthly/yearly volume, streaks, PR counts, muscle distribution. Should read from workouts/measurements, not duplicate their data.

Follow the auth module's layering when building this out:
```
analytics.routes.ts -> analytics.controller.ts -> analytics.service.ts -> analytics.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
