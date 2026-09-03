# workouts module (scaffolded, not yet implemented)

Workout sessions + exercise sets (the core logging feature). Needs: WorkoutSession + WorkoutExercise models, progressive-overload comparison against the previous session for the same exercise, PR detection.

Follow the auth module's layering when building this out:
```
workouts.routes.ts -> workouts.controller.ts -> workouts.service.ts -> workouts.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
