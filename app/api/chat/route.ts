import { DICKBOT_SYSTEM_PROMPT } from "@/lib/prompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      "No Groq API key. Create one at https://console.groq.com/keys and set GROQ_API_KEY.",
      { status: 500 },
    );
  }

  const body = (await req.json()) as { messages?: ChatMessage[] };
  const messages = body.messages ?? [];

  const upstream = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        stream: true,
        temperature: 0.95,
        messages: [
          { role: "system", content: DICKBOT_SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text();
    return new Response(err || "Upstream model request failed.", {
      status: upstream.status || 502,
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = json.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore malformed SSE chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
