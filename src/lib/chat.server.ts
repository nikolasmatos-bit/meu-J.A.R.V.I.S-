export type ChatPayload = {
  messages: { role: "user" | "assistant"; content: string }[];
  settings: { tone: string; length: string; volume: number; persona?: string; mode?: string; temperature?: number };
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

    const contentType = res.headers.get("content-type") ?? "";

    // Fallback: se o backend retornar JSON puro (sem SSE), trata direto
    if (contentType.includes("application/json")) {
      const json = await res.json();
      const content = json.content ?? "";
      if (content) onChunk(content);
      onDone(content);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    // Throttle via requestAnimationFrame (evita re-render por token)
    let pending = "";
    let rafId: number | null = null;

    const flush = () => {
      if (pending) {
        onChunk(pending);
        pending = "";
      }
      rafId = null;
    };

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
        if (data === "[DONE]") break;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            pending += delta;
            if (!rafId) rafId = requestAnimationFrame(flush);
          }
        } catch {}
      }
    }

    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    flush();

    onDone(fullText);
  } catch (e: any) {
    onError(e.message ?? String(e));
  }
}