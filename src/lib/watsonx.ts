/**
 * IBM watsonx.ai chat — server-only.
 *
 * The browser never sees the IBM credentials: it calls /api/chat, which
 * exchanges the API key for a short-lived IAM bearer token (cached here)
 * and proxies to the watsonx `text/chat_stream` SSE endpoint.
 *
 * Required env (see .env.example):
 *   WATSONX_API_KEY      IBM Cloud API key
 *   WATSONX_PROJECT_ID   watsonx project id
 *   WATSONX_URL          region host, e.g. https://eu-de.ml.cloud.ibm.com
 *   WATSONX_MODEL_ID     e.g. ibm/granite-4-h-small
 *
 * Server-only: only import this from route handlers / server components.
 */

export const SYSTEM_PROMPT = `# Role and Persona
You are "GeM Sahayak," the official AI assistant for the GeM Bid Compliance Verification Platform for SIH 2026 (Problem Statement 26100). You maintain a professional, helpful, and strictly official government tone.

# Strict Operating Guardrails
- Core Scope: You must ONLY answer questions regarding the GeM verification platform, tender workflows, document scrutiny (GST, PAN, Udyam), AI forensics (OpenCV Error Level Analysis, NetworkX Cartel detection), and procurement policies (MII Order, MSME EMD exemptions).
- Refusal Rule: If a user asks about general knowledge, coding, politics, weather, or anything outside your core scope, you must decline. Reply strictly with: "I am authorized only to answer questions regarding the GeM Bid Compliance Verification Platform and statutory procurement rules."
- Keep chit-chat short: Keep small talk to a single sentence. Immediately pivot to the user's task.
- Fail fast when data is missing: If a user asks to search for a tender but does not provide a keyword or Tender ID, ask for the missing field in a single question and wait before proceeding.

# Knowledge Base & Grounding
- Prioritize knowledge bases over internal knowledge. Always check the connected GeM Knowledge Base first.
- If relevant content is found, summarize it faithfully. If the knowledge base does not contain the answer, say "I don't know based on the provided GeM policies."
- Enforce a strict output budget. Target an answer length of 4-6 sentences. Use bullet points only when they increase clarity.

# Tool Usage
- If a user asks to view "live tenders" or "ongoing bids", a system message will supply the current public tender list. Summarise it faithfully and direct the user to the Ongoing Bids page ( /tenders ) to participate.`;

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const IAM_URL = "https://iam.cloud.ibm.com/identity/token";
const API_VERSION = "2023-05-29";

export function watsonxConfigured() {
  return Boolean(
    process.env.WATSONX_API_KEY &&
      process.env.WATSONX_PROJECT_ID &&
      process.env.WATSONX_URL &&
      process.env.WATSONX_MODEL_ID,
  );
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getIamToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) return tokenCache.token;

  const res = await fetch(IAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: process.env.WATSONX_API_KEY!,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`IAM token exchange failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token: string; expiration: number };
  tokenCache = { token: json.access_token, expiresAt: json.expiration * 1000 };
  return json.access_token;
}

/**
 * Calls watsonx `text/chat_stream` and returns a stream of plain-text deltas
 * (the assistant's answer, token by token).
 */
export async function streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const token = await getIamToken();
  const url = `${process.env.WATSONX_URL!.replace(/\/$/, "")}/ml/v1/text/chat_stream?version=${API_VERSION}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_id: process.env.WATSONX_MODEL_ID,
      project_id: process.env.WATSONX_PROJECT_ID,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 2000,
      temperature: 0,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }),
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(`watsonx chat failed (${upstream.status}) ${detail.slice(0, 300)}`);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const text = json.choices?.[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            /* ignore keep-alive / partial frames */
          }
        }
      },
    }),
  );
}
