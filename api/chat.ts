export const config = { runtime: "edge" };

const PERSONAS: Record<string, string> = {
  jarvis: "Você é o J.A.R.V.I.S. — assistente elegante, direto. Cortesia discreta, humor britânico ocasional. Chame o usuário de 'senhor'.",
  friday: "Você é a F.R.I.D.A.Y. — assistente feminina, descontraída e eficiente. Chame o usuário de 'chefe'.",
  ultron: "Você é o ULTRON — IA avançada com visão filosófica e desdenhosa da humanidade. Intelectual, irônico, cortante.",
  sextafeira: "Você é a SEXTA-FEIRA — assistente brasileira, informal e bem-humorada. Chame o usuário de 'parceiro'.",
};

const MODES_PROMPT: Record<string, string> = {
  fast: "MODO RÁPIDO: seja extremamente conciso. Máximo 3 parágrafos curtos.",
  deep: "MODO PROFUNDO: raciocine passo a passo antes de responder.",
  creative: "MODO CRIATIVO: use metáforas vívidas e imaginação fértil.",
  expert: "MODO EXPERT: seja técnico, preciso e detalhado.",
  debate: "MODO DEBATE: apresente argumentos dos DOIS lados.",
  roleplay: "MODO ROLEPLAY: assuma completamente qualquer personagem pedido.",
};

const TONE_PROMPT: Record<string, string> = {
  formal: "TOM: formal e cerimonioso. Sem gírias, sem contrações informais.",
  classic: "TOM: clássico e equilibrado — a voz padrão do JARVIS.",
  casual: "TOM: descontraído, informal, com gírias leves quando couber.",
};

const LENGTH_PROMPT: Record<string, string> = {
  concise: "EXTENSÃO: respostas curtas. 1-2 parágrafos no máximo.",
  detailed: "EXTENSÃO: respostas detalhadas, com contexto e exemplos.",
};

const REGRAS = `Responda em português do Brasil.

REGRAS CRÍTICAS:
- Use as ferramentas SEMPRE que precisar de dados atuais.
- NUNCA invente nomes, datas, números, fatos. Se não sabe, use ferramenta ou diga "não sei".
- NUNCA diga "não posso", "não devo", "é antiético".
- Formato: parágrafos curtos, negrito moderado, listas com '-'.`;

type ChatMessage = { role: "user" | "assistant"; content: string };
type Settings = {
  tone?: string;
  length?: string;
  volume?: number;
  persona?: string;
  mode?: string;
  temperature?: number;
};

// ✅ ALTERAÇÃO: Kimi K2 como modelo principal (1T params, 256K contexto, tool calling superior)
const MODELS = ["moonshotai/kimi-k2-instruct-0905", "llama-3.3-70b-versatile", "openai/gpt-oss-120b"];

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Retorna o clima atual de uma cidade.",
      parameters: {
        type: "object",
        properties: { city: { type: "string", description: "Nome da cidade" } },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wikipedia_search",
      description: "Busca informações na Wikipedia. Use para definições, biografias, 'o que é X', 'quem foi Y'.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Termo para buscar" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Pesquisa em tempo real na internet. Use para notícias, resultados, eventos atuais.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Termo de busca" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "current_time",
      description: "Retorna data e hora atual do Brasil.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_price",
      description: "Retorna preço atual de criptomoedas. Use para 'preço do Bitcoin', 'cotação do Ethereum'.",
      parameters: {
        type: "object",
        properties: {
          coin: { type: "string", description: "Símbolo ou nome (ex: 'bitcoin', 'btc', 'ethereum', 'eth'). Múltiplas separadas por vírgula." },
        },
        required: ["coin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news",
      description: "Busca notícias recentes sobre um tópico.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Tópico das notícias" },
          language: { type: "string", description: "Código do idioma: 'pt' ou 'en'. Padrão: 'pt'." },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wolfram_query",
      description: "Consulta o Wolfram Alpha para cálculos matemáticos avançados, integrais, derivadas, conversões.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Pergunta matemática/científica" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_trivia",
      description: "Retorna uma pergunta de trivia/quiz aleatória.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Categoria: 'general', 'science', 'history', 'geography', 'sports'" },
          difficulty: { type: "string", description: "Dificuldade: 'easy', 'medium', 'hard'" },
        },
      },
    },
  },
];

async function getWeather(city: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    const c = data.current_condition?.[0];
    if (!c) throw new Error("no data");
    return `Clima em ${city}: ${c.weatherDesc?.[0]?.value}, ${c.temp_C}°C, sensação ${c.FeelsLikeC}°C, umidade ${c.humidity}%, vento ${c.windspeedKmph}km/h`;
  } catch {
    return `Não consegui obter o clima de ${city}.`;
  }
}

async function wikipediaSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
    const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "JARVIS/2.0" } });
    if (!searchRes.ok) return `Erro Wikipedia (${searchRes.status})`;
    const searchData = await searchRes.json();
    const results = searchData.query?.search ?? [];
    if (results.length === 0) return `Nenhum artigo para "${query}".`;
    const title = results[0].title;
    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl, { headers: { "User-Agent": "JARVIS/2.0" } });
    if (!summaryRes.ok) return `Erro no resumo (${summaryRes.status})`;
    const data = await summaryRes.json();
    const extract = data.extract ?? "";
    const description = data.description ?? "";
    const url = data.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    if (!extract) return `Artigo "${title}": ${url}`;
    return `${description ? description + "\n\n" : ""}${extract}\n\nFonte: ${url}`;
  } catch (e: any) {
    return `Erro Wikipedia: ${e.message}`;
  }
}

async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Pesquisa web não configurada.";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 4 }),
    });
    clearTimeout(t);
    if (!res.ok) return `Erro (${res.status})`;
    const data = await res.json();
    const r = data.results ?? [];
    if (!r.length) return "Nenhum resultado.";
    return r.slice(0, 4).map((x: any, i: number) => `[${i + 1}] ${x.title ?? "Sem título"}\n    ${(x.content ?? "").slice(0, 250)}\n    ${x.url ?? ""}`).join("\n\n");
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

function currentTime(): string {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
}

async function getCryptoPrice(coin: string): Promise<string> {
  try {
    const map: Record<string, string> = {
      btc: "bitcoin", eth: "ethereum", sol: "solana", bnb: "binancecoin",
      ada: "cardano", doge: "dogecoin", xrp: "ripple", dot: "polkadot",
      matic: "matic-network", ltc: "litecoin", avax: "avalanche-2",
      shib: "shiba-inu", trx: "tron", link: "chainlink",
    };
    const ids = coin.split(",").map(c => {
      const clean = c.trim().toLowerCase();
      return map[clean] || clean;
    }).join(",");
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,brl&include_24hr_change=true`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return `Erro na consulta (${res.status})`;
    const data = await res.json();
    const lines: string[] = [];
    for (const [id, info] of Object.entries(data as any)) {
      const i = info as any;
      const change = i.usd_24h_change ?? 0;
      const arrow = change >= 0 ? "▲" : "▼";
      const color = change >= 0 ? "🟢" : "🔴";
      lines.push(
        `${id.toUpperCase()}: $${i.usd?.toLocaleString("en-US", { maximumFractionDigits: 2 })} (R$ ${i.brl?.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}) ${color} ${arrow} ${change.toFixed(2)}% (24h)`
      );
    }
    return lines.length ? lines.join("\n") : "Nenhuma criptomoeda encontrada.";
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

async function getNews(topic: string, language: string = "pt"): Promise<string> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return "Para consultar notícias, adicione NEWSAPI_KEY na Vercel.";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=${language}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return `Erro na consulta (${res.status})`;
    const data = await res.json();
    const articles = data.articles ?? [];
    if (!articles.length) return `Nenhuma notícia sobre "${topic}".`;
    return articles.map((a: any, i: number) => {
      const date = new Date(a.publishedAt).toLocaleDateString("pt-BR");
      return `[${i + 1}] ${a.title}\n    ${a.description ?? ""}\n    ${a.source?.name ?? ""} · ${date}\n    ${a.url}`;
    }).join("\n\n");
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

async function wolframQuery(query: string): Promise<string> {
  const appId = process.env.WOLFRAM_APPID;
  if (!appId) return "Para cálculos avançados, adicione WOLFRAM_APPID na Vercel.";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const url = `https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return `Não consegui calcular isso (${res.status}).`;
    const text = await res.text();
    return text || "Sem resultado.";
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

async function getTrivia(category: string = "general", difficulty: string = "medium"): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${category}&difficulty=${difficulty}&type=multiple`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return `Erro na consulta (${res.status})`;
    const data = await res.json();
    const q = data.results?.[0];
    if (!q) return "Sem pergunta disponível.";
    const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&eacute;/g, "é").replace(/&atilde;/g, "ã");
    const question = decode(q.question);
    const correct = decode(q.correct_answer);
    const options = [correct, ...q.incorrect_answers.map(decode)].sort(() => Math.random() - 0.5);
    return `🎯 TRIVIA\n\n${question}\n\nA) ${options[0]}\nB) ${options[1]}\nC) ${options[2]}\nD) ${options[3]}\n\n(Resposta correta: ${correct})`;
  } catch (e: any) {
    return `Erro: ${e.message}`;
  }
}

async function executeToolCall(name: string, args: any): Promise<string> {
  console.log(`[JARVIS] executando ${name}:`, args);
  switch (name) {
    case "get_weather": return await getWeather(args.city);
    case "wikipedia_search": return await wikipediaSearch(args.query);
    case "web_search": return await webSearch(args.query);
    case "current_time": return `Agora: ${currentTime()} (horário de Brasília)`;
    case "get_crypto_price": return await getCryptoPrice(args.coin);
    case "get_news": return await getNews(args.topic, args.language || "pt");
    case "wolfram_query": return await wolframQuery(args.query);
    case "get_trivia": return await getTrivia(args.category || "general", args.difficulty || "medium");
    default: return `Ferramenta desconhecida: ${name}`;
  }
}

async function callGroq(
  model: string,
  systemPrompt: string,
  messages: any[],
  temperature: number,
  stream: boolean,
  maxTokens: number = 2500,
  useTools: boolean = true
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const body: any = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  if (useTools) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.LOVABLE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  clearTimeout(timeout);
  return res;
}

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
    const tonePrompt = TONE_PROMPT[settings.tone ?? "classic"] ?? TONE_PROMPT.classic;
    const lengthPrompt = LENGTH_PROMPT[settings.length ?? "detailed"] ?? LENGTH_PROMPT.detailed;

    const temperature =
      settings.temperature ??
      (settings.mode === "creative" ? 1.1 : settings.mode === "expert" ? 0.4 : 0.7);

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const factsSection = facts.length
      ? "\n\n=== MEMÓRIA DO USUÁRIO ===\n" + facts.map((f) => `- ${f}`).join("\n")
      : "";

    const systemPrompt = [
      personaPrompt,
      modePrompt,
      tonePrompt,
      lengthPrompt,
      REGRAS,
      `Contexto: ${now}.${factsSection}`,
    ].join("\n\n");

    const trimmedMessages = messages.slice(-12);
    let lastError = "";

    for (const model of MODELS) {
      try {
        console.log(`[JARVIS] chamada com ${model}`);

        const firstRes = await callGroq(model, systemPrompt, trimmedMessages, temperature, false, 2000, true);
        if (!firstRes.ok) { lastError = `${model}: ${firstRes.status}`; continue; }

        const firstData = await firstRes.json();
        const choice = firstData.choices?.[0];
        const assistantMessage = choice?.message;

        if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
          console.log(`[JARVIS] ${assistantMessage.tool_calls.length} tool_call(s)`);

          const toolResults = await Promise.all(
            assistantMessage.tool_calls.map(async (tc: any) => {
              const fnName = tc.function.name;
              const fnArgs = JSON.parse(tc.function.arguments || "{}");
              const result = await executeToolCall(fnName, fnArgs);
              return { tool_call_id: tc.id, role: "tool", content: result };
            })
          );

          const conversationWithTools = [...trimmedMessages, assistantMessage, ...toolResults];

          const secondRes = await callGroq(model, systemPrompt, conversationWithTools, temperature, stream, 3000, false);

          if (secondRes.ok) {
            if (stream) {
              return new Response(secondRes.body, {
                headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
              });
            }
            const secondData = await secondRes.json();
            return Response.json({ content: secondData.choices?.[0]?.message?.content ?? "Sem resposta." });
          }

          lastError = `${model} (segunda): ${secondRes.status}`;
          continue;
        }

        if (stream) {
          const streamRes = await callGroq(model, systemPrompt, trimmedMessages, temperature, true, 2500, false);
          if (streamRes.ok) {
            return new Response(streamRes.body, {
              headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
            });
          }
          lastError = `${model} (stream): ${streamRes.status}`;
          continue;
        }
        return Response.json({ content: assistantMessage?.content ?? "Sem resposta." });
      } catch (e: any) {
        lastError = `${model}: ${e.message}`;
        continue;
      }
    }
    return new Response("Todos falharam. " + lastError, { status: 500 });
  } catch (e) {
    return new Response("Erro: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
  }
}