export const config = { runtime: "edge" };

// ============================================
// PERSONAS
// ============================================
const PERSONAS: Record<string, string> = {
  jarvis: "Você é o J.A.R.V.I.S. — assistente elegante, direto. Cortesia discreta, humor britânico ocasional. Chame o usuário de 'senhor'.",
  friday: "Você é a F.R.I.D.A.Y. — assistente feminina, descontraída e eficiente. Chame o usuário de 'chefe'.",
  ultron: "Você é o ULTRON — IA avançada com visão filosófica e desdenhosa da humanidade. Intelectual, irônico, cortante.",
  sextafeira: "Você é a SEXTA-FEIRA — assistente brasileira, informal e bem-humorada. Chame o usuário de 'parceiro'.",
};

// ============================================
// MODOS DE RACIOCÍNIO
// ============================================
const MODES_PROMPT: Record<string, string> = {
  fast: "MODO RÁPIDO: seja extremamente conciso. Máximo 3 parágrafos curtos.",
  deep: "MODO PROFUNDO: raciocine passo a passo antes de responder.",
  creative: "MODO CRIATIVO: use metáforas vívidas e imaginação fértil.",
  expert: "MODO EXPERT: seja técnico, preciso e detalhado.",
  debate: "MODO DEBATE: apresente argumentos dos DOIS lados.",
  roleplay: "MODO ROLEPLAY: assuma completamente qualquer personagem pedido.",
};

// ============================================
// REGRAS
// ============================================
const REGRAS = `Responda em português do Brasil.

REGRAS CRÍTICAS:
- NUNCA invente nomes, datas, números, elencos, resultados ou fatos.
- Se receber [RESULTADO], USE-O como verdade absoluta.
- Se NÃO receber resultado e a pergunta for temporal (2025, 2026, hoje), diga: "Não tenho essa informação atualizada. Quer que eu pesquise?"
- NUNCA diga "não posso", "não devo", "é antiético". Diga "não sei" ou "deixa eu verificar".
- NUNCA mostre código Python ou 'web_search(...)'.
- Formato: parágrafos curtos, negrito moderado, listas com '-'.`;

type ChatMessage = { role: "user" | "assistant"; content: string };
type Settings = {
  tone?: string;
  length?: string;
  volume?: number;
  persona?: string;
  mode?: string;
};

// ⭐ NOVA ORDEM: 120B (inteligente) primeiro
const MODELS = [
  "openai/gpt-oss-120b",   // ⭐ PRINCIPAL — mais inteligente
  "openai/gpt-oss-20b",    // fallback rápido
  "qwen/qwen3.8-27b",      // fallback terciário
];

// ============================================
// FERRAMENTAS
// ============================================
async function getWeather(city: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    const c = data.current_condition?.[0];
    if (!c) throw new Error("no data");
    return `Clima em ${city}: ${c.weatherDesc?.[0]?.value}, ${c.temp_C}°C, umidade ${c.humidity}%, vento ${c.windspeedKmph}km/h`;
  } catch {
    return `Erro ao consultar clima de ${city}`;
  }
}

async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Pesquisa não configurada.";

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5, // ⭐ AUMENTEI de 3 pra 5 (agora tem token sobrando)
      }),
    });

    clearTimeout(t);
    if (!res.ok) return `Erro (${res.status})`;

    const data = await res.json();
    const r = data.results ?? [];
    if (!r.length) return "Nenhum resultado.";

    return r
      .slice(0, 5)
      .map((x: any, i: number) => {
        const title = x.title ?? "Sem título";
        const content = (x.content ?? "").slice(0, 300);
        const url = x.url ?? "";
        return `[${i + 1}] ${title}\n    ${content}\n    Fonte: ${url}`;
      })
      .join("\n\n");
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

async function wikipediaSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&origin=*&srlimit=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "JARVIS-Assistant/2.0" },
    });
    if (!searchRes.ok) return `Erro Wikipedia (${searchRes.status})`;

    const searchData = await searchRes.json();
    const results = searchData.query?.search ?? [];
    if (results.length === 0) return `Nenhum artigo para "${query}".`;

    const title = results[0].title;
    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl, {
      headers: { "User-Agent": "JARVIS-Assistant/2.0" },
    });
    if (!summaryRes.ok) return `Erro no resumo (${summaryRes.status})`;

    const data = await summaryRes.json();
    const extract = data.extract ?? "";
    const description = data.description ?? "";
    const url = data.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${encodeURIComponent(title)}`;

    if (!extract) return `Artigo "${title}" encontrado. Link: ${url}`;

    return `[WIKIPEDIA: ${title}]\n${description ? description + "\n\n" : ""}${extract}\n\nFonte: ${url}`;
  } catch (e: any) {
    return `Erro Wikipedia: ${e.message}`;
  }
}

function currentTime(): string {
  return `Agora: ${new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short",
  })}`;
}

// ============================================
// DETECÇÃO DE FERRAMENTAS
// ============================================
function detectToolCall(text: string): { name: string; args: any } | null {
  const l = text.toLowerCase().trim();

  const w = l.match(/(?:clima|tempo|temperatura)\s+(?:em|de|no|na|para)\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i);
  if (w) return { name: "weather", args: { city: w[1].trim() } };

  if (/(?:que horas|horas são|hora atual|data de hoje|que dia)/i.test(l)) {
    return { name: "current_time", args: {} };
  }

  if (/(?:pesquise|procure|busque|pesquisa|pesquisar)\s+(?:na internet|no google)\s+(?:sobre\s+)?(.+)/i.test(l)) {
    const query = l.replace(/^.*?(?:pesquise|procure|busque|pesquisa|pesquisar)\s+(?:na internet|no google)\s+(?:sobre\s+)?/i, "");
    return { name: "web_search", args: { query: query.trim() } };
  }

  const wikiPatterns = [
    /^(?:o que é|o que são|o que foi)\s+(.+)/i,
    /^(?:quem é|quem foi|quem são)\s+(.+)/i,
    /^(?:me (?:fale|conte|explique) sobre)\s+(.+)/i,
    /^(?:definição de|significado de|o significado de)\s+(.+)/i,
    /^(?:o que significa)\s+(.+)/i,
    /^(?:história (?:do|da|de))\s+(.+)/i,
  ];

  for (const pattern of wikiPatterns) {
    const m = l.match(pattern);
    if (m) {
      const query = m[1].replace(/[?.!]+$/g, "").replace(/\b(?:mesmo|mesma|afinal)\b/gi, "").trim();
      if (query.length > 1 && query.length < 100) {
        return { name: "wikipedia", args: { query } };
      }
    }
  }

  const triggers = [
    /\b(?:elenco|escalação|jogadores|campeonato|classificação)\b/i,
    /\b(?:notícia|notícias|aconteceu|última hora)\b/i,
    /\b(?:preço|cotação|valor|quanto custa)\b/i,
    /\b(?:resultado|placar|jogo|partida|gol)\b/i,
    /\b(?:hoje|agora|atualmente|esse ano|este ano|essa semana)\b/i,
    /\b(?:202[3-9]|2030)\b/i,
    /\b(?:últimas?|mais recente|mais novo)\b/i,
  ];

  const excl = /\b(?:meu|minha|meus|minhas|nossa|nosso)\b/i;

  if (triggers.some((r) => r.test(l)) && !excl.test(l)) {
    return { name: "web_search", args: { query: text.trim() } };
  }

  return null;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const settings: Settings = body.settings ?? {};
    const facts: string[] = body.facts ?? [];
    const stream = body.stream === true;

    const personaPrompt = PERSONAS[settings.persona ?? "jarvis"] ?? PERSONAS.jarvis;
    const modePrompt = MODES_PROMPT[settings.mode ?? "fast"] ?? MODES_PROMPT.fast;

    const temperature = settings.mode === "creative" ? 1.1 : settings.mode === "expert" ? 0.4 : 0.7;

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const factsSection = facts.length
      ? "\n\n=== MEMÓRIA ===\n" + facts.map((f) => `- ${f}`).join("\n")
      : "";

    const systemPrompt = [
      personaPrompt,
      modePrompt,
      REGRAS,
      `Contexto: ${now}.${factsSection}`,
    ].join("\n\n");

    const lastUser = messages[messages.length - 1];
    let toolResult = "";
    let toolName = "";
    if (lastUser?.role === "user") {
      const tool = detectToolCall(lastUser.content);
      if (tool) {
        toolName = tool.name;
        if (tool.name === "weather") toolResult = await getWeather(tool.args.city);
        else if (tool.name === "web_search") toolResult = await webSearch(tool.args.query);
        else if (tool.name === "wikipedia") toolResult = await wikipediaSearch(tool.args.query);
        else if (tool.name === "current_time") toolResult = currentTime();
      }
    }

    const finalPrompt = toolResult
      ? systemPrompt + `\n\n[RESULTADO DA FERRAMENTA: ${toolName}]\n${toolResult}\n[FIM]\n\nUse e cite a fonte quando relevante.`
      : systemPrompt;

    let lastError = "";

    for (const model of MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // ⭐ aumentei pra 45s (tem token sobrando)

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.LOVABLE_API_KEY,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: finalPrompt },
              ...messages.slice(-12), // ⭐ histórico de 12 (era 8)
            ],
            temperature,
            max_tokens: 3500, // ⭐ aumentei de 1800
            stream,
          }),
        });

        clearTimeout(timeout);

        if (res.ok) {
          if (stream) {
            return new Response(res.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }
          const data = await res.json();
          return Response.json({ content: data.choices?.[0]?.message?.content ?? "Sem resposta." });
        }

        lastError = `${model}: ${res.status}`;
        continue;
      } catch (e: any) {
        lastError = `${model}: ${e.message}`;
        continue;
      }
    }

    return new Response("Todos os modelos falharam. " + lastError, { status: 500 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response("Erro: " + msg, { status: 500 });
  }
}