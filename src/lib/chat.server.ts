export type ChatPayload = {
  messages: { role: "user" | "assistant"; content: string }[];
  settings: { tone: string; length: string; volume: number; persona?: string; mode?: string };
  facts?: string[];
};

export async function chatStreamFn(
  payload: ChatPayload,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!res.ok) { onError(await res.text()); return; }
    if (!res.body) { onError("Sem stream"); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) { fullText += delta; onChunk(delta); }
        } catch {}
      }
    }
    onDone(fullText);
  } catch (e: any) {
    onError(e.message ?? String(e));
  }
}