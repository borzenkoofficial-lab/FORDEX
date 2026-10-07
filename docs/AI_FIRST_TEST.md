# FORDEX AI — first test run

## 1. Server environment

Set these variables in the Vercel project:

- `ANYMODEL_API_KEY` — required for the default AnyModel provider.
- `OPENAI_API_KEY` — required when using the Astra provider.
- `FORDEX_AI_PROVIDER` — optional; `anymodel` is the default.
- `FORDEX_ANYMODEL_MODEL` — optional; defaults to `gpt-5.6-luna`.
- `FORDEX_ASTRA_MODEL` — optional; defaults to `gpt-6-astra`.
- `FORDEX_ANYMODEL_BASE_URL` / `FORDEX_ASTRA_BASE_URL` — optional endpoint overrides.

Never put provider keys into `VITE_*` variables.

## 2. Open the test cabinet

Use the FORDEX route:

`#control`

The cabinet is intentionally separate from the public content flow.

## 3. Test A — source discovery + research

Choose:

- Operation: `MARKET SCAN`
- Provider: `ANYMODEL`
- Model: default
- Run

Expected:

`RESEARCH READY → sources → model output`

The cabinet displays both the server-discovered sources and the model's own cited sources. The discovered source list is the trusted input to the test; model output is treated as untrusted until reviewed.

## 4. Test B — company research

Choose:

- Operation: `COMPANY RESEARCH`
- Select a company
- Run

Expected:

- fresh sources for the selected company;
- structured facts when the model follows the requested format;
- raw output for debugging;
- source URLs visible in the result.

## 5. Test C — post draft

Choose:

- Operation: `CREATE POST`
- Use the previous research result as context
- Run

Expected:

`MODEL OUTPUT → POST DRAFT → WAITING_APPROVAL`

The draft can be approved or rejected inside the cabinet. Approval is only a test state; it does not publish the post to a public channel.

## 6. Safety gates

The current model gateway returns:

- `approvalRequired: true`
- `canPublish: false`
- `canOverrideScore: false`
- `canChangeFormula: false`

The ranking engine remains deterministic.

## 7. What is not connected yet

Telegram/public publishing, persistent server-side draft storage, multi-agent execution, and automatic evidence verification are not part of this first test pass. The next production layer should connect the research result to the existing evidence/change proposal contracts before allowing anything to enter the real newsroom.
