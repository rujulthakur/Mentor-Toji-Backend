# ai module (scaffolded, not yet implemented)

AIController -> AIService -> ContextBuilder -> PromptBuilder -> Grok API -> ResponseParser -> chat module. Context builder pulls profile + workout history + measurements + PRs automatically; never asks Grok to remember.

Follow the auth module's layering when building this out:
```
ai.routes.ts -> ai.controller.ts -> ai.service.ts -> ai.repository.ts -> Mongo model(s)
```
Controllers stay thin (parse req, call service, send response). All business
logic lives in the service. All Mongoose calls live in the repository —
never import a model directly into a controller or service.
