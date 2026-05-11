import { SiteHeader } from "@/components/site-header";
import { DIMENSION_LABELS } from "@/lib/judges/schema";

export const metadata = {
  title: "HACK-26 · Guia de avaliação",
};

type DimensionGuide = {
  key: keyof typeof DIMENSION_LABELS;
  intro: string;
  evidence: string[];
  pros: string[];
  cons: string[];
  rubric: Array<{ band: string; range: string; what: string }>;
  oneLiner: string;
};

const GUIDES: DimensionGuide[] = [
  {
    key: "vibe",
    intro:
      "Mede polish, identidade visual, gosto. Não é “está bonito?” em abstrato — é o projeto recusar o visual default da IA generativa e ter cara própria. Um app feio mas coerente vence um app genérico-bonito.",
    evidence: ["screenshots", "URL do demo", "frames do vídeo", "landing/README como peça gráfica"],
    pros: [
      "Identidade tipográfica clara (escolha de fontes coerente, não bagunçada)",
      "Microinterações com intenção (hover, foco, transições com motivo)",
      "Paleta com personalidade — mesmo restrita",
      "Voice/microcopy que soa humano (sem “✨ powered by AI ✨”)",
    ],
    cons: [
      "Gradiente roxo/azul + glassmorphism sem motivo",
      "Botões com sombra exagerada e emoji em tudo",
      "Mistura de 3+ famílias de fonte sem hierarquia",
      "Componentes de UI library padrão sem customização",
    ],
    rubric: [
      { band: "0–3", range: "AI default", what: "qualquer prompt de v0 produziria isso. Sem identidade. Polish baixo." },
      { band: "4–6", range: "ok", what: "limpo, mas intercambiável. Falta voz visual." },
      { band: "7–8", range: "tem cara", what: "decisões deliberadas. Você lembraria do projeto em uma semana." },
      { band: "9–10", range: "editorial", what: "design que sustenta o produto. Vibe coesa do logo ao 404." },
    ],
    oneLiner: "É genérico-bonito ou tem gosto?",
  },
  {
    key: "originalidade",
    intro:
      "Mede o quão novo é o ângulo. Não basta o problema ser conhecido — o jeito de atacar precisa ter um insight. Sempre escreva no reasoning: “isso me lembra X porque Y”. Se você não conseguir comparar, anote — é sinal de originalidade alta.",
    evidence: ["descrição do projeto", "README", "transcrição do vídeo/pitch", "produtos existentes que você conhece"],
    pros: [
      "Ângulo que muda o framing do problema (não só uma UI nova)",
      "Combinação inesperada de ferramentas/contextos",
      "Restrição de escopo bem escolhida (resolve uma fatia, mas resolve)",
      "Insight do usuário que aparece no produto",
    ],
    cons: [
      "“Uber pra X” sem distinção real",
      "Wrapper de LLM sobre dor já saturada (chatbot pra atendimento, etc.)",
      "Template clonado com troca de marca",
      "Solução em busca de problema",
    ],
    rubric: [
      { band: "0–3", range: "clone", what: "existe há 5 anos com 30 concorrentes. Sem ângulo próprio." },
      { band: "4–6", range: "variação", what: "lembra muito X. Pequenas mudanças, mas direção conhecida." },
      { band: "7–8", range: "remix", what: "combina coisas conhecidas de um jeito que não é óbvio." },
      { band: "9–10", range: "ângulo novo", what: "te faz pensar “por que ninguém fez assim?”." },
    ],
    oneLiner: "Você já viu isso antes? Onde?",
  },
  {
    key: "execucao",
    intro:
      "Mede qualidade técnica: arquitetura coerente, README útil, estrutura inteligível, ausência de red flags. Não premie escolhas de stack “da moda” se o projeto não as justifica — premie coerência interna.",
    evidence: ["tree do repositório", "README", "commits", "configuração (env, build)", "demo funcional"],
    pros: [
      "README explica o que é, como rodar, decisões trade-off",
      "Estrutura de pastas previsível (alguém novo entra e acha as coisas)",
      "Limites claros entre módulos/camadas",
      "Sinais de teste, lint, type-safety — proporcional ao escopo",
    ],
    cons: [
      "Secrets/keys no client ou hardcoded",
      "node_modules/.next/dist no repo",
      "Um arquivo gigante (>2k linhas) fazendo tudo",
      "README só com “projeto pra hackathon”",
      "Stack “moderna” aplicada sem necessidade (microservices num CRUD de 3 telas)",
    ],
    rubric: [
      { band: "0–3", range: "quebrado", what: "não roda, README inútil, código que assusta abrir." },
      { band: "4–6", range: "roda", what: "funciona pra demo, mas frágil. Decisões inconsistentes." },
      { band: "7–8", range: "sólido", what: "coerente. Outro dev consegue contribuir sem trauma." },
      { band: "9–10", range: "exemplar", what: "qualidade de open-source maduro dentro da janela do hackathon." },
    ],
    oneLiner: "Você abriria PR nesse repo?",
  },
  {
    key: "viabilidade",
    intro:
      "Mede sobrevivência fora do hackathon. Pensa como investidor pragmático — mas sem ser cruel com protótipo. Pergunte: existe usuário claro com dor real? Existe um caminho plausível pra receita ou tração?",
    evidence: ["descrição/pitch", "demo funcional", "público-alvo declarado", "exemplos concretos de uso"],
    pros: [
      "Usuário-alvo nomeado de forma específica (não “todo mundo”)",
      "Dor real, articulada com exemplo concreto",
      "Modelo de receita ou tração plausível mesmo que rudimentar",
      "Tem versão mínima útil — não depende de “quando tiver 1M users”",
    ],
    cons: [
      "“Quem quiser usar” como público-alvo",
      "Dependência crítica de algo que não controla (API gratuita, viral, etc.)",
      "Modelo que só funciona em escala não-realista",
      "Compete com solução já gratuita melhor",
    ],
    rubric: [
      { band: "0–3", range: "demo only", what: "interessante como exercício. Sem caminho fora da sala." },
      { band: "4–6", range: "talvez", what: "dá pra imaginar uso, mas economia frágil." },
      { band: "7–8", range: "viável", what: "alguém pagaria. Caminho de tração visível." },
      { band: "9–10", range: "negócio", what: "produto-mercado óbvio. Investidor liga." },
    ],
    oneLiner: "Existe fora desta sala?",
  },
];

export default function JudgeGuidePage() {
  return (
    <div className="page">
      <SiteHeader variant="judge" current="guia" />
      <div className="page-body">
        <article className="jg-stage">
          <header className="jg-hero">
            <div className="t-eyebrow">painel dos juízes · guia</div>
            <h1 className="jg-title">
              Como <em>julgar</em>.
            </h1>
            <p className="jg-lede">
              Quatro dimensões, escala de 0 a 10, sempre com evidência. Use
              esta página como referência rápida durante a avaliação — abre em
              uma outra aba se precisar.
            </p>
            <ul className="jg-toc">
              {GUIDES.map((g, i) => {
                const label = DIMENSION_LABELS[g.key];
                return (
                  <li key={g.key}>
                    <a href={`#${g.key}`} className="jg-toc-link">
                      <span className="t-mono-num jg-toc-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="jg-toc-label">{label.label}</span>
                      <span className="jg-toc-sub muted">{label.sub}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </header>

          <section className="jg-rules" aria-label="Regras gerais">
            <h2 className="jg-section-title">Regras gerais</h2>
            <div className="jg-rule-grid">
              <Rule
                head="Avalie com evidência"
                body="Cada nota precisa apontar pra algo do projeto — screenshot N, README na seção X, trecho do pitch. Sem evidência, a nota não conta."
              />
              <Rule
                head="Use a faixa toda"
                body="0 e 10 existem por motivo. Notas todas em 6–8 não diferenciam — o ranking morre. Se está abaixo de 4 ou acima de 9, fale o porquê."
              />
              <Rule
                head="Uma dimensão por vez"
                body="Não deixe o impacto da landing puxar a nota de execução técnica. Cada dimensão tem evidência específica."
              />
              <Rule
                head="Sem benevolência genérica"
                body="“Esforço notável” não é nota. Critique como crítico, não como tio gentil. Mas seja específico — “interface fraca” é vazio; “sem hierarquia visível na home, hierarquia tipográfica plana” serve."
              />
            </div>
          </section>

          {GUIDES.map((g, i) => (
            <DimensionSection key={g.key} guide={g} index={i} />
          ))}

          <section className="jg-rules" aria-label="Anti-padrões transversais">
            <h2 className="jg-section-title">Penalidades transversais</h2>
            <p className="jg-lede" style={{ marginTop: 0 }}>
              Se você encontrar qualquer um destes, deve aparecer no
              reasoning — independente da dimensão.
            </p>
            <ul className="jg-flat-list">
              <li><strong>AI default look</strong> em vibe — penalidade dura. Esse projeto deveria parecer feito por uma pessoa.</li>
              <li><strong>Secrets no client</strong> ou no repo — execução cai obrigatoriamente.</li>
              <li><strong>Demo quebrado / não acessível</strong> — penaliza viabilidade e execução. Anote o que faltou.</li>
              <li><strong>README ausente ou genérico</strong> — execução máxima passa a ser ~5, não importa o resto.</li>
              <li><strong>Promessas sem entrega</strong> (vídeo mostra X, demo não faz X) — viabilidade cai.</li>
            </ul>
          </section>

          <footer className="jg-foot">
            <p className="muted">
              Em dúvida entre duas notas, escreva o reasoning das duas e
              escolha a que justifica melhor. Se o reasoning é igual, a nota
              menor ganha.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Rule({ head, body }: { head: string; body: string }) {
  return (
    <div className="jg-rule">
      <h3 className="jg-rule-head">{head}</h3>
      <p>{body}</p>
    </div>
  );
}

function DimensionSection({
  guide,
  index,
}: {
  guide: DimensionGuide;
  index: number;
}) {
  const label = DIMENSION_LABELS[guide.key];
  return (
    <section className="jg-dim" id={guide.key} aria-labelledby={`${guide.key}-h`}>
      <header className="jg-dim-head">
        <div className="jg-dim-num t-mono-num">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="jg-dim-titlewrap">
          <div className="t-eyebrow">dimensão · {label.sub}</div>
          <h2 id={`${guide.key}-h`} className="jg-dim-title">
            {label.label}.
          </h2>
          <p className="jg-dim-oneliner">&ldquo;{guide.oneLiner}&rdquo;</p>
        </div>
      </header>

      <p className="jg-dim-intro">{guide.intro}</p>

      <div className="jg-cols">
        <div className="jg-col">
          <h3 className="t-eyebrow jg-col-head">onde olhar</h3>
          <ul className="jg-list">
            {guide.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
        <div className="jg-col jg-col-pros">
          <h3 className="t-eyebrow jg-col-head">conta a favor</h3>
          <ul className="jg-list">
            {guide.pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="jg-col jg-col-cons">
          <h3 className="t-eyebrow jg-col-head">conta contra</h3>
          <ul className="jg-list">
            {guide.cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="jg-rubric" aria-label={`Rubrica · ${label.label}`}>
        <div className="jg-rubric-head t-eyebrow">rubrica</div>
        <ol className="jg-rubric-list">
          {guide.rubric.map((r) => (
            <li className="jg-rubric-row" key={r.band}>
              <span className="jg-rubric-band t-mono-num">{r.band}</span>
              <span className="jg-rubric-name">{r.range}</span>
              <span className="jg-rubric-what">{r.what}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
