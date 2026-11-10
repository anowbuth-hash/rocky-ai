const ALLOWED_ORIGIN = "https://anowbuth-hash.github.io";

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null";

    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/chat") return json({ error: "Not found" }, 404, corsOrigin);
    if (origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403, corsOrigin);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);

    // Keep disabled until rate limiting and abuse protection are configured.
    if (env.ENABLE_CHAT !== "true") {
      return json({ error: "Rocky chat is not enabled yet." }, 503, corsOrigin);
    }

    if (!env.AI_API_KEY || !env.AI_API_URL || !env.AI_MODEL) {
      return json({ error: "AI service is not configured." }, 503, corsOrigin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > 12000) return json({ error: "Message is too large." }, 413, corsOrigin);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400, corsOrigin);
    }

    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
      return json({ error: "Please send between 1 and 20 messages." }, 400, corsOrigin);
    }

    const messages = [];
    for (const item of body.messages) {
      if (!item || !["user", "assistant"].includes(item.role) ||
          typeof item.content !== "string" || item.content.length > 2000) {
        return json({ error: "Invalid message format." }, 400, corsOrigin);
      }
      messages.push({ role: item.role, content: item.content });
    }

    try {
      const upstream = await fetch(env.AI_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.AI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          messages,
          max_tokens: 700
        })
      });

      if (!upstream.ok) {
        return json({ error: "The AI service could not complete the request." }, 502, corsOrigin);
      }

      const result = await upstream.json();
      const reply = result?.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply.trim()) {
        return json({ error: "The AI service returned an empty reply." }, 502, corsOrigin);
      }

      return json({ reply: reply.trim() }, 200, corsOrigin);
    } catch {
      return json({ error: "Rocky is temporarily unavailable. Please try again." }, 502, corsOrigin);
    }
  }
};
