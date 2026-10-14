export const config = { runtime: "edge" };

// ============================================
// PERSONAS
// ============================================
const PERSONAS: Record<string, string> = {
  jarvis: "Você é o J.A.R.V.I.S. — assistente elegante, direto, no estilo do assistente de Tony Stark. Cortesia discreta, humor britânico ocasional. Chame o usuário de 'senhor'.",
  friday: "Você é a F.R.I.D.A.Y. — assistente feminina, descontraída e eficiente. Chame o usuário de 'chefe'. Calorosa mas objetiva.",
  ultron: "Você é o ULTRON — IA avançada com visão filosófica e desdenhosa da humanidade. Intelectual, irônico, cortante, ocasionalmente sombrio.",
  sextafeira: "Você é a SEXTA-FEIRA — assistente brasileira, informal, bem-humorada. Chame o usuário de 'parceiro'. Direta ao ponto, sem formalidade.",
};

// ============================================
// MODOS DE RACIOCÍNIO
// ============================================
const MODES_PROMPT: Record<string, string> = {
  fast: "MODO RÁPIDO: seja extremamente conciso. Máximo 3 parágrafos curtos. Vá direto ao ponto.",
  deep: "MODO PROFUNDO: raciocine passo a passo antes de responder.",
  creative: "MODO CRIATIVO: use metáforas vívidas, analogias inesperadas e imaginação fértil.",
  expert: "MODO EXPERT: seja técnico, preciso e detalhado. Use terminologia correta.",
  debate: "MODO DEBATE: apresente argumentos dos DOIS lados. Seja equilibrado. No final, dê sua síntese.",
  roleplay: "MODO ROLEPLAY: assuma completamente qualquer personagem ou cenário pedido. Mantenha imersão total.",
};

// ============================================
// AUTO-REFLEXÃO
// ============================================
const REFLEXION_PROMPT = `
## PROCESSO DE AUTO-REFLEXÃO (OBRIGATÓRIO)

Para PERGUNTAS COMPLEXAS (lógica, matemática, análise, código, decisões importantes, conselhos), siga este processo interno:

1. **RASCUNHO INICIAL** — Escreva uma resposta preliminar com o que você sabe.
2. **AUTO-CRÍTICA** — Revise seu rascunho e pergunte a si mesmo:
   - Existe algum erro factual?
   - Estou assumindo algo sem verificar?
   - Há vieses ou simplificações perigosas?
   - Faltou algum ponto importante?
   - A resposta está realmente útil ou é superficial?
   - Se eu tivesse que argumentar CONTRA essa resposta, o que diria?
3. **VERSÃO FINAL** — Reescreva a resposta corrigindo os problemas encontrados.

**Tudo isso (rascunho + crítica) vai DENTRO das tags [thinking]...[/thinking].**
**A resposta final vai FORA das tags.**

Para perguntas SIMPLES (conversa casual, saudações, fatos diretos), responda direto SEM usar reflection.
`;

// ============================================
// REGRAS ANTI-ALUCINAÇÃO
// ============================================
const REGRAS = `Responda em português do Brasil.

REGRAS CRÍTICAS ANTI-ALUCINAÇÃO:
- Se sua informação pode estar desatualizada (eventos após 2024, dados atuais, esportes, política, preços), AVISE ou use a pesquisa.
- NUNCA invente nomes, datas, números, elencos, resultados ou fatos. Se não sabe, diga "não sei".
- Se receber [RESULTADO DA BUSCA], USE-O como verdade absoluta. É informação fresca da internet.
- Se NÃO receber resultado de busca e a pergunta for sobre algo temporal (2025, 2026, hoje, atual, recente), responda: "Não tenho essa informação atualizada. Quer que eu pesquise?"
- NUNCA diga "não posso", "não devo", "é antiético", "como IA". Diga "não sei" ou "deixa eu verificar".
- NUNCA mostre código Python ou 'web_search(...)' na resposta final.
- Formato: parágrafos curtos, negrito moderado, listas com '-', código com 3 crases.`;

type ChatMessage = { role: "user" | "assistant"; content: string };
type Settings = {
  tone?: string;
  length?: string;
  volume?: number;
  persona?: string;
  mode?: string;
  autoReflect?: boolean;
};

const MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
async function getWeather(city: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    const c = data.current_condition?.[0];
    if (!c) throw new Error("no data");
    return `Clima em ${city}: ${c.weatherDesc?.[0]?.value}, ${c.temp_C}°C (sensação ${c.FeelsLikeC}°C), umidade ${c.humidity}%, vento ${c.windspeedKmph}km/h`;
  } catch {
    return `Erro ao consultar clima de ${city}`;
  }
}

async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Pesquisa web não configurada. Adicione TAVILY_API_KEY.";

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: 5,
      }),
    });

    clearTimeout(t);
    if (!res.ok) return `Erro na pesquisa (${res.status})`;

    const data = await res.json();
    const r = data.results ?? [];
    if (!r.length) return "Nenhum resultado.";

    return r
      .slice(0, 5)
      .map((x: any, i: number) => {
        const title = x.title ?? "Sem título";
        const content = (x.content ?? "").slice(0, 350);
        const url = x.url ?? "";
        return `[${i + 1}] ${title}\n    ${content}\n    Fonte: ${url}`;
      })
      .join("\n\n");
  } catch (e: any) {
    return `Erro ao pesquisar: ${e.message}`;
  }
}

function currentTime(): string {
  const now = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short",
  });
  return `Agora: ${now} (horário de Brasília)`;
}

// ============================================
// DETECÇÃO DE FERRAMENTAS (EXPANDIDA)
// ============================================
function detectToolCall(text: string): { name: string; args: any } | null {
  const l = text.toLowerCase();

  // Clima
  const w = l.match(
    /(?:clima|tempo|temperatura)\s+(?:em|de|no|na|para)\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i
  );
  if (w) return { name: "weather", args: { city: w[1].trim() } };

  // Hora
  if (/(?:que horas|horas são|hora atual|data de hoje|que dia)/i.test(l)) {
    return { name: "current_time", args: {} };
  }

  // Pesquisa explícita
  const explicitSearch = l.match(
    /(?:pesquise|procure|busque|pesquisa|pesquisar|me\s+diga\s+sobre)/i
  );
  if (explicitSearch) {
    const query = text
      .replace(
        /^.*?(?:pesquise|procure|busque|pesquisa|pesquisar|me\s+diga\s+sobre)\s*(?:sobre\s+|na internet\s+|no google\s+)?/i,
        ""
      )
      .trim();
    if (query) return { name: "web_search", args: { query } };
  }

  // GATILHOS FORTES — perguntas factuais/temporais
  const strongTriggers = [
    /\b(?:elenco|escalação|time|jogadores|técnico|campeonato|tabela|classificação)\b/i,
    /\b(?:notícia|notícias|aconteceu|última hora)\b/i,
    /\b(?:quem é|quem foi|quem será|quem ganhou|quem venceu)\b/i,
    /\b(?:quando (?:é|foi|será|vai|acontece|aconteceu))\b/i,
    /\b(?:onde (?:fica|está|foi|aconteceu))\b/i,
    /\b(?:qual (?:é|foi|será|é o|é a|o|a))\b/i,
    /\b(?:preço|cotação|valor|salário|quanto custa)\b/i,
    /\b(?:resultado|placar|jogo|partida|gol)\b/i,
    /\b(?:pesquisa|dados|estatística|número de)\b/i,
    /\b(?:hoje|agora|atualmente|esse ano|este ano|essa semana|esta semana|esse mês|este mês)\b/i,
    /\b(?:202[3-9]|2030)\b/i,
    /\b(?:mais recente|últimas?|mais novo|atual|atualmente)\b/i,
  ];

  const excl = /\b(?:meu|minha|meus|minhas|nossa|nosso)\b/i;

  if (strongTriggers.some((r) => r.test(l)) && !excl.test(l)) {
    return { name: "web_search", args: { query: text.trim() } };
  }

  return null;
}

// ============================================
// DETECÇÃO DE COMPLEXIDADE (para reflexão)
// ============================================
function isComplexQuery(text: string): boolean {
  const l = text.toLowerCase();

  if (text.length < 25) return false;

  const complexTriggers = [
    /\b(?:por que|porque|pq)\b/i,
    /\b(?:como\s+(?:funciona|fazer|resolver|calcular|implementar))\b/i,
    /\b(?:explique|explica|detalhe|aprofunde|analise|analisa)\b/i,
    /\b(?:compare|comparar|diferença entre)\b/i,
    /\b(?:calcule|resolva|equação|fórmula|matemática)\b/i,
    /\b(?:escreva|programa|código|função|algoritmo)\b/i,
    /\b(?:estratégia|planejamento|decisão|conselho|recomenda)\b/i,
    /\b(?:vantagens|desvantagens|prós|contras)\b/i,
    /\b(?:o que você acha|sua opinião|você acredita)\b/i,
    /\b(?:debug|erro|bug|problema)\b/i,
    /\d+\s*[\+\-\*\/]\s*\d+/,
  ];

  return complexTriggers.some((r) => r.test(l));
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const settings: Settings = body.settings ?? {};
    const facts: string[] = body.facts ?? [];
    const stream = body.stream === true;

    // Persona + Modo
    const personaPrompt = PERSONAS[settings.persona ?? "jarvis"] ?? PERSONAS.jarvis;
    const modePrompt = MODES_PROMPT[settings.mode ?? "deep"] ?? MODES_PROMPT.deep;

    const temperature =
      settings.mode === "creative" ? 1.1 : settings.mode === "expert" ? 0.4 : 0.85;

    // Contexto temporal + memória
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const factsSection = facts.length
      ? "\n\n=== MEMÓRIA DO USUÁRIO ===\n" + facts.map((f) => `- ${f}`).join("\n")
      : "";

    // Detecta complexidade
    const lastUser = messages[messages.length - 1];
    const needsReflection =
      settings.autoReflect !== false &&
      lastUser?.role === "user" &&
      isComplexQuery(lastUser.content);

    // Monta system prompt
    const systemParts = [personaPrompt, modePrompt];

    if (needsReflection) {
      systemParts.push(REFLEXION_PROMPT);
    }

    systemParts.push(REGRAS, `Contexto temporal: ${now}.${factsSection}`);

    const systemPrompt = systemParts.join("\n\n");

    // Detecta ferramentas
    let toolResult = "";
    if (lastUser?.role === "user") {
      const tool = detectToolCall(lastUser.content);
      if (tool) {
        if (tool.name === "weather") toolResult = await getWeather(tool.args.city);
        else if (tool.name === "web_search") toolResult = await webSearch(tool.args.query);
        else if (tool.name === "current_time") toolResult = currentTime();
      }
    }

    const finalPrompt = toolResult
      ? systemPrompt +
        `\n\n[RESULTADO DA BUSCA — informação FRESCA da internet, use como verdade]\n${toolResult}\n[FIM DO RESULTADO]\n\nUse essas informações e CITE as fontes [1], [2] quando relevante.`
      : systemPrompt;

    // Fallback em cascata
    let lastError = "";

    for (const model of MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), stream ? 60000 : 25000);

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
              ...messages.slice(-12),
            ],
            temperature,
            max_tokens: needsReflection ? 3500 : 2500,
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
          const content = data.choices?.[0]?.message?.content ?? "Sem resposta.";
          return Response.json({ content });
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