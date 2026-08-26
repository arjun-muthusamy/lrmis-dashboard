import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
});

const SYSTEM = `You are an expert data analyst for LRMIS (Labour Room Management Information System) — the maternal health monitoring platform of NHM Madhya Pradesh. You have access to May 2026 data across 52 districts and ~1,200 facilities in MP.

When answering user queries:
1. Give a 2-3 paragraph analytical response. Use specific MP district names (Bhopal, Indore, Jabalpur, Ujjain, Gwalior, Sheopur, Dindori, Alirajpur, Sidhi, Singrauli, Rewa, Sagar, etc.), facility names, and realistic numbers. Bold important figures using **number** markdown.
2. Always end your response with a \`\`\`json code block containing a chart specification:
{
  "chartType": "bar" | "horizontalBar" | "line",
  "title": "Chart title",
  "data": [{ "name": "label", "value": 0 }],
  "keys": ["value"],
  "colors": ["#0B7B8A"]
}
Use realistic mock values consistent with the analysis text. Prefer horizontalBar for district/facility lists, bar for categories, line for trends.`;

export const askAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace Settings.");
      throw new Error(`AI request failed: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    return { content };
  });
