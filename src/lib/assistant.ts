/**
 * GeM Sahayak assistant — server-only, provider-agnostic.
 *
 * Picks a backend at request time:
 *   1. IBM watsonx.ai   — if the WATSONX_* variables are set
 *   2. Anthropic Claude — if ANTHROPIC_API_KEY is set
 *   3. Local knowledge base — always available, no network, canned answers
 *
 * Every path returns a ReadableStream<Uint8Array> of plain-text deltas, so the
 * /api/chat route and the client streaming reader stay identical.
 */
import { SYSTEM_PROMPT, watsonxConfigured, streamChat, type ChatMessage } from "@/lib/watsonx";

export type { ChatMessage };

export type AssistantMode = "watsonx" | "anthropic" | "local";

export function assistantMode(): AssistantMode {
  if (watsonxConfigured()) return "watsonx";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "local";
}

export async function streamAssistant(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const mode = assistantMode();
  if (mode === "watsonx") return streamChat(messages);
  if (mode === "anthropic") return streamAnthropic(messages);
  return streamLocal(messages);
}

/* ----------------------------- Anthropic ---------------------------- */

async function streamAnthropic(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": "2023-06-01",
  };
  // Organisation-level keys must name a workspace.
  if (process.env.ANTHROPIC_WORKSPACE_ID) {
    headers["anthropic-workspace-id"] = process.env.ANTHROPIC_WORKSPACE_ID;
  }

  const upstream = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM_PROMPT,
      stream: true,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    // Fall back to the local responder rather than failing the request.
    console.error("[assistant] anthropic error", upstream.status, detail.slice(0, 300));
    return streamLocal(messages);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                type?: string;
                delta?: { type?: string; text?: string };
              };
              if (json.type === "content_block_delta" && json.delta?.text) {
                controller.enqueue(encoder.encode(json.delta.text));
              }
            } catch {
              /* ignore keep-alive / partial frames */
            }
          }
        }
      },
    }),
  );
}

/* --------------------------- Local fallback ------------------------- */

const REFUSAL =
  "I am authorized only to answer questions regarding the GeM Bid Compliance Verification Platform and statutory procurement rules.";

type Rule = { match: RegExp; answer: string };

const RULES: Rule[] = [
  {
    match: /\b(hi|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b/i,
    answer:
      "Namaskar. I can help with tender participation, statutory document scrutiny (GST, PAN, Udyam, EPFO), the AI forensic and cartel checks, and Make-in-India / MSME policy. What would you like to know?",
  },
  {
    match: /\b(gst|gstin)\b/i,
    answer:
      "For GST compliance the platform checks the GST Registration Certificate against the GSTN sandbox. It confirms the GSTIN is active, that its first two digits match the declared state, that the embedded PAN is consistent, and that return filing is regular. An inactive or suspended GSTIN is a mandatory (gate) failure; irregular filing is raised as a warning for the officer.",
  },
  {
    match: /\b(pan)\b/i,
    answer:
      "The PAN is validated structurally (AAAAA0000A) and then verified as ACTIVE against the Income Tax / NSDL sandbox. It must also be consistent with characters 3–12 of the GSTIN. A PAN that cannot be verified as active is a gate failure and caps the compliance score.",
  },
  {
    match: /\b(udyam|msme|mse|small enterprise)\b.*\b(register|certificate|proof|verif)/i,
    answer:
      "MSME status is established from a valid Udyam registration, verified against the Udyam portal. Once verified, the engine automatically applies MSE Order 2012 relaxations — EMD exemption and prior-turnover / experience relaxations — without the bidder having to claim them.",
  },
  {
    match: /\b(emd|earnest money|exempt|exemption)\b/i,
    answer:
      "EMD (Earnest Money Deposit) is automatically waived for bidders whose Udyam (MSE) registration is verified, and for DPIIT-recognised Startups, under the Public Procurement (MSE) Order 2012 and the Startup India exemption. The vendor does not need to upload a separate exemption request — Dynamic Policy Routing applies it the moment the registration is confirmed against the source portal.",
  },
  {
    match: /\b(cartel|collusion|bid.?rig|networkx|syndicate|ring)\b/i,
    answer:
      "Cartel detection builds a relational graph across every bidder on a tender using NetworkX. It flags supposedly competing firms that share a Director Identification Number, a registered address or a bank account. When a shared director links two or more bidders, the officer sees a Cartel Link flag on the roster with the shared DIN and the connected bids, and can open the graph for the full picture.",
  },
  {
    match: /\b(ela|error.?level|opencv|forensic|tamper|forgery|photoshop|altered)\b/i,
    answer:
      "Document forensics runs on every uploaded PDF. It reads the file metadata (editor fingerprints, creation-vs-modification date skew, incremental saves), compares any embedded QR payload against the printed figures, and checks for byte-identical reuse across bidders. Scanned certificates also get an OpenCV Error-Level-Analysis heat-map that highlights digitally altered regions. The file gets an integrity score; a \"suspect\" verdict caps the compliance score and marks the bid Not Recommended.",
  },
  {
    match: /\b(local content|make.?in.?india|mii|class.?[i1]|class.?ii)\b/i,
    answer:
      "Make-in-India is enforced through Dynamic Policy Routing. The engine reads the declared local-content percentage, checks it against the tender's required class (Class-I ≥ 50%, Class-II ≥ 20%), and looks for a supporting CA-attested bill of materials. A declaration without support is raised as a warning for the officer.",
  },
  {
    match: /\b(score|scoring|recommend|risk|weight|how .*(evaluat|verif|work))\b/i,
    answer:
      "Each bid is scored as a weighted average of its checks — PAN, GST, Udyam, MCA, EPFO, debarment, document integrity, cross-field consistency and the tender's own eligibility rules. Gate failures (PAN, GST, debarment) or a forensic \"suspect\" verdict cap the score at 34 and mark the bid Not Recommended. A score of 80 or above with no failures and at most one warning is Recommended. The engine only recommends — the Procurement Officer records the final decision.",
  },
  {
    match: /\b(mpin)\b/i,
    answer:
      "The MPIN is a unique 6-digit code issued to every vendor at registration. It is your signing key: you must enter it to open a bid on any tender. It is shown once at registration — save it then. Later you can view it from your Company Profile, but only after re-entering your account password.",
  },
  {
    match: /\b(register|sign ?up|onboard|how .*(join|participate|apply|bid))\b/i,
    answer:
      "To participate, register as a Vendor from the Sign Up page with your entity's statutory details (PAN, GSTIN, Udyam if applicable, turnover, authorised director). You are added to the national bidder registry and issued an MPIN. Then open a tender from Ongoing Bids, enter your MPIN, and complete the seven-step bid wizard.",
  },
  {
    match: /\b(document|papers?|upload|what .*(need|required|scrutin))\b/i,
    answer:
      "A typical bid packet is scrutinised for: GST Registration Certificate, PAN, Udyam / MSME certificate (if claimed), a CA-certified turnover statement with UDIN, EPFO ECR, OEM authorisation and any ISO certificate the tender requires. Each file is data-extracted, cross-checked against its government source, and run through forensic tamper detection.",
  },
];

function localReply(userText: string, groundingText?: string): string {
  const q = userText.toLowerCase();

  if (groundingText) {
    return `Here are the current live tenders on the Government e-Marketplace:\n\n${groundingText}\n\nOpen the Ongoing Bids page (/tenders) to filter by ministry and participate. You will need to be signed in and to enter your MPIN to open a bid.`;
  }

  for (const rule of RULES) {
    if (rule.match.test(q)) return rule.answer;
  }

  // Clearly off-topic → the fixed refusal from the persona guardrails.
  if (/\b(weather|movie|song|joke|python|javascript|code|football|cricket|news|politic|stock|recipe)\b/i.test(q)) {
    return REFUSAL;
  }

  return "I can help with tender participation, statutory document checks (GST, PAN, Udyam, EPFO), the AI forensic and NetworkX cartel checks, compliance scoring, the MPIN, and Make-in-India / MSME policy. Could you rephrase your question around one of those?";
}

async function streamLocal(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const grounding = messages.find((m) => m.content.startsWith("[GeM Knowledge Base"));
  const groundingText = grounding
    ? grounding.content.replace(/^\[GeM Knowledge Base[^\]]*\]\n/, "").split("\n\n")[0]
    : undefined;

  const reply = localReply(lastUser, groundingText);
  const encoder = new TextEncoder();
  const words = reply.split(/(\s+)/); // keep whitespace tokens

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
}
