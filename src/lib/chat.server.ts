export type ChatPayload = {
  messages: { role: "user" | "assistant"; content: string }[];
  settings: { tone: string; length: string; volume: number };
  facts?: string[];
};

export async function chatFn(payload: ChatPayload): Promise<{ content: string }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}