# chat module (scaffolded, not yet implemented)

AI conversation storage -- every message, response, token usage, and the context snapshot sent to the model, so a conversation is fully recoverable. Consumed by the ai module.

Follow the auth module's layering when building this out:
```
chat.routes.ts -> chat.controller.ts -> chat.service.ts -> chat.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
