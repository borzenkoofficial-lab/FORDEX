# FORDEX AI model gateway

FORDEX keeps model API keys on the server. Browser code must call `POST /api/ai/editor` and must never receive provider secrets.

## Providers

### AnyModel
- Base URL: `https://anymodel.org/v1`
- Secret: `ANYMODEL_API_KEY`
- Optional model override: `FORDEX_ANYMODEL_MODEL`
- Default model: `gpt-5.6-luna`

### Astra
- Base URL: `https://api.openai.com/v1`
- Secret: `OPENAI_API_KEY`
- Optional model override: `FORDEX_ASTRA_MODEL`
- Default model: `gpt-6-astra`

## Routing

Set `FORDEX_AI_PROVIDER` to `anymodel` or `astra`.

Optional explicit base URLs are supported through:
- `FORDEX_ANYMODEL_BASE_URL`
- `FORDEX_ASTRA_BASE_URL`

Do not use `VITE_*` variables for provider secrets. Vite variables are client-visible.

## API

### GET /api/ai/editor

Returns gateway health and configured-provider state without exposing secrets.

### POST /api/ai/editor

Example payload:

```json
{
  "objective": "Проверь новые сделки российского AI-рынка за неделю",
  "companyId": null,
  "context": {
    "language": "ru",
    "requiresEvidence": true
  },
  "provider": "anymodel"
}
```

The response is normalized and always carries:
- `approvalRequired: true`
- `canPublish: false`
- `canOverrideScore: false`
- `canChangeFormula: false`

Model output is therefore a research/drafting result, not a direct publication command.

## Next integration layer

The next production step is to connect the model response to the existing FORDEX tool gateway so that every proposed company update, evidence record, ranking refresh, news draft, and visual request passes through the existing validation and approval gates.
