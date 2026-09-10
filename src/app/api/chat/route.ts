import { NextResponse } from "next/server";
import { getPublicTenders } from "@/lib/public-tenders";
import { streamAssistant, assistantMode, type ChatMessage } from "@/lib/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 20;
const MAX_CHARS = 4000;

const TENDER_INTENT =
  /\b(live|ongoing|current|open|latest)\s+(tender|bid)s?\b|\bongoing bids\b|\blist .*(tender|bid)/i;

/** The "connected OpenAPI tool": fetch the public tender list and hand it to
 *  the model as a grounding system message. */
async function tenderGrounding(): Promise<ChatMessage | null> {
  try {
    const { results } = await getPublicTenders();
    if (!results.length) return null;
    const lines = results
      .slice(0, 8)
      .map(
        (t) =>
          `- ${t.bid_no} · ${t.title} · ${t.ministry} · closes ${t.end_date} (${t.days_left} days left)`,
      )
      .join("\n");
    return {
      role: "user",
      content: `[GeM Knowledge Base — current live tenders]\n${lines}\n\nSummarise the relevant ones for the user and point them to the Ongoing Bids page (/tenders) to participate.`,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof (m as ChatMessage).content === "string" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant"),
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Expected a trailing user message." }, { status: 400 });
  }

  const last = messages[messages.length - 1].content;
  const augmented = [...messages];
  if (TENDER_INTENT.test(last)) {
    const grounding = await tenderGrounding();
    if (grounding) augmented.splice(augmented.length - 1, 0, grounding);
  }

  try {
    const stream = await streamAssistant(augmented);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        "X-Assistant-Mode": assistantMode(),
      },
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
