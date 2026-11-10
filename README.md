# Rocky AI backend — Phase 1.1 scaffold

This is a starter Cloudflare Worker-style backend. It is not deployed or connected to an AI provider yet.

## Safety status

- The chat endpoint is disabled unless `ENABLE_CHAT=true`.
- Do not enable public chat until rate limiting, abuse protection, provider terms, and privacy notices have been reviewed.
- Never put a private AI API key in `index.html`, browser JavaScript, or any public GitHub file.
- This scaffold is not production-ready authentication or abuse protection.

## Server-side settings

Add these only in the hosting provider's server-side settings:

- `AI_API_KEY` — secret API key
- `AI_API_URL` — provider's compatible chat-completions endpoint
- `AI_MODEL` — provider model identifier
- `ENABLE_CHAT` — keep unset or false until protections are ready

Do not commit real values.

## Request format

POST `/api/chat` with JSON:

```json
{
  "messages": [
    { "role": "user", "content": "Hello Rocky" }
  ]
}
```

Expected successful response:

```json
{ "reply": "Hello! How can I help?" }
```

## Before deployment

1. Check the hosting account eligibility and terms.
2. Choose an AI provider whose terms allow the intended audience and use.
3. Configure per-user/IP rate limits and abuse monitoring.
4. Add a privacy notice and clear error handling.
5. Store credentials as server-side secrets only.
6. Test privately before enabling public access.
