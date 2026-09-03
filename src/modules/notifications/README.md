# notifications module (scaffolded, not yet implemented)

Scheduled + triggered notifications (workout reminders, PR celebrations, weekly/monthly summaries). Pairs with node-cron jobs in src/cron/.

Follow the auth module's layering when building this out:
```
notifications.routes.ts -> notifications.controller.ts -> notifications.service.ts -> notifications.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
