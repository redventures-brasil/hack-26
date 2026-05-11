/* HACK-26 — seed data
   Fictional teams with the Hack-26 vibe.
   Mirrors design/data.js — ported as typed module. */

export type Status = "pending" | "evaluating" | "done" | "failed";

export type Scores = {
  vibe: number | null;
  originalidade: number | null;
  execucao: number | null;
  viabilidade: number | null;
};

export type Team = {
  id: string;
  rank: number | null;
  team: string;
  project: string;
  tagline: string;
  description: string;
  github: string;
  demo: string | null;
  video: boolean;
  status: Status;
  submittedAt: string;
  evaluatedAt: string | null;
  error?: string;
  scores: Scores;
};

export type DimensionEval = {
  score: number;
  one_liner: string;
  strengths: string[];
  weaknesses: string[];
  evidence_used: string[];
  reasoning: string;
};

export type FullEval = {
  vibe: DimensionEval;
  originalidade: DimensionEval;
  execucao: DimensionEval;
  viabilidade: DimensionEval;
};

export const SEED_TEAMS: Team[] = [
  {
    id: "tokenless",
    rank: 1,
    team: "Sem Token Mas Com Fé",
    project: "Refila",
    tagline: "Divide a conta do grupo escutando o áudio do uber.",
    description:
      "Um app que escuta o áudio enquanto você está num Uber em grupo e divide automaticamente a conta com base em quem desceu primeiro. Usa transcrição em tempo real + geofencing pra mapear quem foi pra onde. A ideia surgiu depois de seis pessoas brigando no PIX no fim de uma sexta.",
    github: "github.com/sem-token-fe/refila",
    demo: "refila-hack26.vercel.app",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 16:48",
    evaluatedAt: "12/05/2026 · 16:53",
    scores: { vibe: 9.2, originalidade: 9.4, execucao: 7.8, viabilidade: 6.4 },
  },
  {
    id: "compradores",
    rank: 2,
    team: "Compradores de Token",
    project: "Opus.coffee",
    tagline: "Energia em forma de prompt. Cafeteria para devs.",
    description:
      "Cardápio digital pra cafeteria de dev: cada bebida tem um 'prompt sugerido' impresso na manga do copo. Backend usa um LLM pra rotacionar prompts conforme o horário e tipo de bebida. Já temos uma cafeteria piloto fechada em Pinheiros.",
    github: "github.com/compradores/opus-coffee",
    demo: "opus.coffee",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 16:34",
    evaluatedAt: "12/05/2026 · 16:37",
    scores: { vibe: 9.6, originalidade: 7.8, execucao: 7.4, viabilidade: 8.2 },
  },
  {
    id: "esperando",
    rank: 3,
    team: "Esperando Renovar",
    project: "Boletim",
    tagline: "Newsletter de bairro escrita por moradores, curada por IA.",
    description:
      "Cada bairro tem um WhatsApp do prédio. Boletim conecta nesses WhatsApps (com consentimento) e devolve um boletim semanal por bairro com o que importou: obras, eventos, problemas. Modelo edita, modera e cita as falas.",
    github: "github.com/esperando-renovar/boletim",
    demo: "boletim.cidade",
    video: false,
    status: "done",
    submittedAt: "12/05/2026 · 16:18",
    evaluatedAt: "12/05/2026 · 16:22",
    scores: { vibe: 7.6, originalidade: 8.4, execucao: 8.0, viabilidade: 8.6 },
  },
  {
    id: "gerando",
    rank: 4,
    team: "Gerando Valor SA",
    project: "Tela Verde",
    tagline: "Linter editorial pra texto longo, com vibe de revisor humano.",
    description:
      "Um editor que sublinha frases inchadas, sugere cortes e mantém o tom. Pensado pra quem escreve newsletter, ensaios, posts longos. Diferente do Grammarly: não tenta corrigir gramática, tenta cortar gordura.",
    github: "github.com/gerando-valor/telaverde",
    demo: "telaverde.app",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 16:02",
    evaluatedAt: "12/05/2026 · 16:06",
    scores: { vibe: 8.4, originalidade: 6.8, execucao: 8.6, viabilidade: 7.2 },
  },
  {
    id: "contextwindow",
    rank: 5,
    team: "Context Window",
    project: "Marginália",
    tagline: "PDFs com comentários laterais geridos por IA.",
    description:
      "Abre qualquer PDF acadêmico e a margem direita ganha um co-leitor: parafraseia, aponta o que é técnica vs argumento, sugere referências cruzadas. Pensado pra mestrado, leitura técnica, papers densos.",
    github: "github.com/contextwindow/marginalia",
    demo: "marginalia.read",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 15:45",
    evaluatedAt: "12/05/2026 · 15:49",
    scores: { vibe: 7.0, originalidade: 7.4, execucao: 8.2, viabilidade: 7.0 },
  },
  {
    id: "opusliberado",
    rank: 6,
    team: "Opus Liberado",
    project: "Trinco",
    tagline: "Porteiro inteligente que entende quem é morador.",
    description:
      "Câmera no portão + LLM multimodal. Reconhece moradores frequentes sem cadastro de rosto: aprende com vídeo bruto. Se for entregador conhecido, abre. Se for estranho, manda push no condomínio.",
    github: "github.com/opus-liberado/trinco",
    demo: "trinco.app",
    video: false,
    status: "done",
    submittedAt: "12/05/2026 · 15:28",
    evaluatedAt: "12/05/2026 · 15:33",
    scores: { vibe: 6.4, originalidade: 6.2, execucao: 7.8, viabilidade: 7.8 },
  },
  {
    id: "vibestack",
    rank: 7,
    team: "Vibestack",
    project: "Letrinha",
    tagline: "Aprende a ler com seu filho via histórias geradas.",
    description:
      "App pra pais lerem com filhos: você escolhe 3 palavras que o filho está aprendendo e o app gera uma história curta usando essas palavras com ilustração. Pensado pra alfabetização inicial (5-7 anos).",
    github: "github.com/vibestack/letrinha",
    demo: "letrinha.app",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 15:12",
    evaluatedAt: "12/05/2026 · 15:17",
    scores: { vibe: 7.4, originalidade: 5.8, execucao: 7.0, viabilidade: 7.6 },
  },
  {
    id: "stacktrace",
    rank: 8,
    team: "Stack Trace Brigada",
    project: "Plantão",
    tagline: "Ouvidor 24/7 pra dev de plantão. Não resolve, descomprime.",
    description:
      "Chat de voz pra quem tá de oncall às 3 da manhã. Não é debug — é alguém pra ouvir você reclamar do alerta enquanto o redeploy roda. Funciona como rubber duck de áudio, com memória do incidente.",
    github: "github.com/stacktrace/plantao",
    demo: "plantao.fm",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 14:54",
    evaluatedAt: "12/05/2026 · 15:00",
    scores: { vibe: 8.6, originalidade: 7.2, execucao: 6.0, viabilidade: 5.2 },
  },
  {
    id: "doisturnos",
    rank: 9,
    team: "Dois Turnos",
    project: "Cardápio",
    tagline: "Menu da semana usando o que sobrou da feira.",
    description:
      "Cadastra o que comprou na feira/sacolão, e o app monta 5 jantares pra semana usando só esses ingredientes + 2 itens de pantry. Reduz desperdício, ajuda quem cozinha em casa toda noite.",
    github: "github.com/dois-turnos/cardapio",
    demo: "cardapio-app.vercel.app",
    video: false,
    status: "done",
    submittedAt: "12/05/2026 · 14:38",
    evaluatedAt: "12/05/2026 · 14:42",
    scores: { vibe: 5.8, originalidade: 5.2, execucao: 7.0, viabilidade: 6.4 },
  },
  {
    id: "sextou",
    rank: 10,
    team: "Sextou Codando",
    project: "Vinheta",
    tagline: "Gera trilha sonora pra reels com vibe específica.",
    description:
      "Cola um link de reel ou tiktok, descreve a vibe em uma frase, recebe 30s de música original (sem copyright) sincronizada nos cortes do vídeo. Útil pra criador pequeno que não quer dor de cabeça.",
    github: "github.com/sextou-codando/vinheta",
    demo: "vinheta.studio",
    video: true,
    status: "done",
    submittedAt: "12/05/2026 · 14:22",
    evaluatedAt: "12/05/2026 · 14:27",
    scores: { vibe: 8.2, originalidade: 6.6, execucao: 5.8, viabilidade: 5.6 },
  },
  {
    id: "haiku",
    rank: 11,
    team: "Time Haiku",
    project: "Cortado",
    tagline: "Resumos de 1 frase pra qualquer mensagem de áudio.",
    description:
      "Tio mandou áudio de 12 min no zap? Cola o link, recebe 1 frase resumindo o que foi dito. Treinado especificamente em PT-BR coloquial, com tolerância pra divagação.",
    github: "github.com/time-haiku/cortado",
    demo: "cortado.audio",
    video: false,
    status: "done",
    submittedAt: "12/05/2026 · 14:06",
    evaluatedAt: "12/05/2026 · 14:09",
    scores: { vibe: 6.2, originalidade: 4.8, execucao: 6.4, viabilidade: 6.8 },
  },
  {
    id: "tomato",
    rank: 12,
    team: "Pomodoro Quebrado",
    project: "Foco",
    tagline: "Timer de pomodoro que negocia pausas com você.",
    description:
      "Igual pomodoro normal, mas quando você ignora a pausa de 5 min, a IA negocia: 'beleza, mais 10 min, mas depois eu tranco o vscode por 7'. Aprende seu padrão. Reduz burnout.",
    github: "github.com/pomodoro-quebrado/foco",
    demo: "foco-timer.app",
    video: false,
    status: "evaluating",
    submittedAt: "12/05/2026 · 16:55",
    evaluatedAt: null,
    scores: { vibe: null, originalidade: null, execucao: null, viabilidade: null },
  },
  {
    id: "rpobre",
    rank: null,
    team: "R Pobre",
    project: "Pratique",
    tagline: "Sandbox pra praticar entrevista técnica com personas.",
    description:
      "Simula entrevista técnica de FAANG. Você escolhe o nível do entrevistador, ele te dá problema, você resolve falando em voz alta, ele responde com follow-ups duros. Bom pra dev junior se preparar.",
    github: "github.com/r-pobre/pratique",
    demo: "pratique.dev",
    video: false,
    status: "pending",
    submittedAt: "12/05/2026 · 16:58",
    evaluatedAt: null,
    scores: { vibe: null, originalidade: null, execucao: null, viabilidade: null },
  },
  {
    id: "permanecer",
    rank: null,
    team: "Permanecer Conectado",
    project: "Plug",
    tagline: "Marketplace de extensões de IDE feitas por humanos.",
    description:
      "Loja de extensões pra VS Code/Cursor focada em ferramentas pequenas e específicas, tipo 'reordena imports do nosso jeito'. Curadoria humana, sem slop.",
    github: "github.com/permanecer/plug",
    demo: null,
    video: false,
    status: "failed",
    submittedAt: "12/05/2026 · 14:30",
    evaluatedAt: null,
    error: "O repositório está privado. Torne-o público e edite a submissão.",
    scores: { vibe: null, originalidade: null, execucao: null, viabilidade: null },
  },
];

export const REFILA_EVAL: FullEval = {
  vibe: {
    score: 9.2,
    one_liner:
      "A landing tem a confiança visual de um produto que cobra. O fluxo do app respira.",
    strengths: [
      "Identidade tipográfica forte — não parece template",
      "Microcopy é a melhor parte: 'desceu primeiro paga primeiro' explica em 4 palavras",
      "Cor mínima, decisões intencionais",
      "Animações curtas, nada gratuito",
    ],
    weaknesses: [
      "Tela de splash do app ainda é placeholder",
      "Logo no header está oversized em mobile",
    ],
    evidence_used: ["screenshot 1", "screenshot 3", "demo URL", "pitch 00:48"],
    reasoning:
      "A vibe de Refila é a parte mais polida da submissão. A landing comunica o produto em uma frase — 'divide a conta do uber em grupo' — e o resto da página suporta sem inflar. O app em si tem decisões editoriais raras pra hackathon: tipografia coesa, cor sóbria, microcopy que dá personalidade sem encher de emoji. Perde meio ponto pelo splash e pelo header mobile.",
  },
  originalidade: {
    score: 9.4,
    one_liner: "É um problema universal que ninguém tinha embrulhado em produto.",
    strengths: [
      "Insight original: ouvir o áudio é mais barato que rastrear 6 GPSs",
      "Combina geofencing + transcrição de um jeito que não vi antes",
      "O caso de uso é tão específico que vira identidade",
    ],
    weaknesses: [
      "Existe risco de overlap com features futuras do próprio app de transporte",
    ],
    evidence_used: ["descrição", "pitch 01:12", "README"],
    reasoning:
      "Hackathons produzem 50 chatbots por edição. Refila é um dos raríssimos projetos com um ângulo que não se reduz a 'GPT + categoria'. O insight de usar áudio em vez de GPS pra resolver atribuição de viagem é genuinamente novo. Penalizo só pela exposição a risco de roadmap de plataforma.",
  },
  execucao: {
    score: 7.8,
    one_liner:
      "Funcionando ponta-a-ponta com soluções pragmáticas, mas a arquitetura é frágil.",
    strengths: [
      "Demo deployada e funcional",
      "Tipos no front estão bem cuidados",
      "Boa separação de transcrição vs lógica de divisão",
    ],
    weaknesses: [
      "API key do provedor de transcrição no client",
      "Sem tratamento de áudio com múltiplas vozes simultâneas",
      "README explica o que mas não como rodar localmente",
    ],
    evidence_used: ["repositório (147 commits)", "demo URL", "README"],
    reasoning:
      "Funciona, e em hackathon isso vale muito. O código mostra que o time pensou no caminho feliz com cuidado, mas as bordas estão soltas: secrets expostas no client e nenhuma estratégia pra quando duas pessoas falam ao mesmo tempo (que é praticamente o estado natural dentro de um carro). Refatorável, não estrutural.",
  },
  viabilidade: {
    score: 6.4,
    one_liner:
      "O produto é claro. O modelo de negócio depende de pulos grandes.",
    strengths: [
      "Problema real, frequência alta, dor concreta",
      "Possível parceria com apps de transporte é óbvia",
    ],
    weaknesses: [
      "Modelo de receita é assinatura ou cobrança por divisão — nenhum dos dois testado",
      "Custo de transcrição em produção pode comer margem",
      "Sem time fundador com background de pagamentos",
    ],
    evidence_used: ["pitch 02:30", "descrição", "perfil do time"],
    reasoning:
      "Refila resolve uma dor real e recorrente, mas a tese sobrevive ou morre em distribuição: ou vira feature de um app de transporte, ou vira app que ninguém abre porque divide PIX é o suficiente. O time não mostrou tese de growth nem de pricing — comum em hackathon, mas penaliza viabilidade. Não é fatal, é uma conversa pra ter.",
  },
};

export function toneFor(score: number | null): "lowtone" | "midtone" | "hightone" | "toptone" {
  if (score == null) return "lowtone";
  if (score >= 9) return "toptone";
  if (score >= 7) return "hightone";
  if (score >= 5) return "midtone";
  return "lowtone";
}

export function splitScore(n: number | null): [string, string | null] {
  if (n == null) return ["—", null];
  const [whole, dec] = n.toFixed(1).split(".");
  return [whole, dec];
}

export function avg(scores: Scores): number | null {
  const vals = Object.values(scores).filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function fmt1(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1);
}
