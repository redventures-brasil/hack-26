import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DIMENSION_LABELS } from "@/lib/judges/schema";
import { listSubmissions, listVotes } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HACK-26 · Como a avaliação funciona",
  description:
    "Transparência sobre a avaliação: IA julga 4 dimensões, juízes humanos refinam, plateia vota.",
};

type DimensionPublic = {
  key: keyof typeof DIMENSION_LABELS;
  question: string;
  intro: string;
  evidence: string[];
  pros: string[];
};

const DIMENSIONS: DimensionPublic[] = [
  {
    key: "vibe",
    question: "É genérico-bonito ou tem gosto?",
    intro:
      "Mede polish, identidade visual e gosto. Não é “está bonito?” em abstrato — é o projeto ter cara própria e recusar o visual default que sai de prompt genérico. Um app feio mas coerente vence um app genérico-bonito.",
    evidence: ["screenshots", "URL do demo", "frames do vídeo", "landing/README como peça gráfica"],
    pros: [
      "Identidade tipográfica clara e coerente",
      "Microinterações com intenção (hover, foco, transições com motivo)",
      "Paleta com personalidade, mesmo restrita",
      "Microcopy que soa humano — sem clichê de IA",
    ],
  },
  {
    key: "originalidade",
    question: "Você já viu isso antes? Onde?",
    intro:
      "Mede o quão novo é o ângulo. Não basta o problema ser conhecido — o jeito de atacar precisa ter um insight. A nota leva em conta se o projeto lembra de algo existente (e por quê).",
    evidence: ["descrição do projeto", "README", "transcrição do vídeo/pitch"],
    pros: [
      "Ângulo que muda o framing do problema",
      "Combinação inesperada de ferramentas ou contextos",
      "Restrição de escopo bem escolhida — resolve uma fatia mas resolve",
      "Insight do usuário que aparece no produto",
    ],
  },
  {
    key: "execucao",
    question: "Você abriria PR nesse repo?",
    intro:
      "Mede qualidade técnica: arquitetura coerente, README útil, estrutura inteligível, ausência de red flags. Não premia escolhas de stack “da moda” — premia coerência interna entre as decisões.",
    evidence: ["tree do repositório", "README", "commits", "configuração (env, build)", "demo funcional"],
    pros: [
      "README explica o que é, como rodar e os trade-offs",
      "Estrutura de pastas previsível",
      "Limites claros entre módulos",
      "Sinais de teste, lint, type-safety — proporcionais ao escopo",
    ],
  },
  {
    key: "viabilidade",
    question: "Existe fora desta sala?",
    intro:
      "Mede sobrevivência fora do hackathon. Pensa como investidor pragmático — sem ser cruel com protótipo. Pergunta: existe usuário claro com dor real? Existe caminho plausível pra tração ou receita?",
    evidence: ["descrição/pitch", "demo funcional", "público-alvo declarado", "exemplos concretos de uso"],
    pros: [
      "Usuário-alvo nomeado de forma específica",
      "Dor real, articulada com exemplo concreto",
      "Modelo de receita ou tração plausível, mesmo rudimentar",
      "Tem versão mínima útil — não depende de “quando tiver 1M users”",
    ],
  },
];

export default async function AvaliacaoPage() {
  const submissions = await listSubmissions();
  const evaluated = submissions.filter((s) => s.status === "done").length;
  const totalProjects = submissions.length;
  const votes = await listVotes();
  const popularVotes = votes.length;

  return (
    <div className="page">
      <SiteHeader variant="public" current="avaliacao" />
      <div className="page-body">
        <article className="jg-stage">
          <header className="jg-hero">
            <div className="t-eyebrow">transparência · hack-26</div>
            <h1 className="jg-title">
              Como <em>avaliamos</em>.
            </h1>
            <p className="jg-lede">
              IA julga primeiro em 4 dimensões, juízes humanos decidem o
              ranking, plateia vota em paralelo. Tudo público — qualquer um
              pode entender (e contestar) uma nota, desde que aponte a
              evidência.
            </p>
          </header>

          <section className="jg-rules" aria-label="Como funciona">
            <h2 className="jg-section-title">O processo</h2>
            <ol className="ev-flow">
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">01</div>
                <div>
                  <h3 className="ev-step-head">Submissão indexada</h3>
                  <p>
                    O time submete o projeto. Um bot abre o repositório,
                    extrai README, lê screenshots, abre o demo. Esse
                    “dossiê” é o que vai pro juiz.
                  </p>
                </div>
              </li>
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">02</div>
                <div>
                  <h3 className="ev-step-head">IA julga 4 dimensões</h3>
                  <p>
                    Claude Sonnet 4.6 avalia cada dimensão separadamente,
                    com instrução específica por dimensão. Devolve nota
                    0–10 + reasoning estruturado em PT-BR com evidência
                    citada (screenshot N, README seção X, etc).
                  </p>
                </div>
              </li>
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">03</div>
                <div>
                  <h3 className="ev-step-head">Humanos decidem</h3>
                  <p>
                    Júri técnico revisa as notas da IA e ajusta — pode
                    aceitar, contestar ou rejeitar. Plateia vota em
                    paralelo (1–5 estrelas). O ranking final é humano. A
                    IA é assistente, não juiz absoluto.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section aria-label="Em números">
            <h2 className="jg-section-title">Em números</h2>
            <div className="ev-stats">
              <Stat
                value={totalProjects}
                label="projetos submetidos"
              />
              <Stat
                value={evaluated}
                label="avaliados pela IA"
                hint={
                  totalProjects > 0
                    ? `${Math.round((evaluated / totalProjects) * 100)}% do total`
                    : undefined
                }
              />
              <Stat
                value={popularVotes}
                label="votos populares registrados"
              />
            </div>
          </section>

          <section aria-label="As quatro dimensões">
            <h2 className="jg-section-title">As 4 dimensões</h2>
            <p
              className="jg-lede"
              style={{ marginTop: -4, marginBottom: 32 }}
            >
              Cada projeto recebe uma nota 0–10 em cada dimensão. A nota
              total é a média ponderada — sem pesos secretos, pode conferir
              no GitHub.
            </p>

            {DIMENSIONS.map((d, i) => (
              <DimensionCard key={d.key} dim={d} index={i} />
            ))}
          </section>

          <section className="jg-rules" aria-label="Por que IA + humanos">
            <h2 className="jg-section-title">Por que IA + humanos?</h2>
            <div className="jg-rule-grid">
              <div className="jg-rule">
                <h3 className="jg-rule-head">IA dá consistência</h3>
                <p>
                  O mesmo critério é aplicado em todos os projetos, sem
                  cansaço, sem favorito. Reduz “um juiz odeia gradiente
                  roxo” virando viés geral.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Humanos dão julgamento</h3>
                <p>
                  Contexto, energia da sala, leitura de pitch, química do
                  time — coisa que modelo de linguagem não captura. A IA
                  empurra, o humano decide.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Plateia dá legitimidade</h3>
                <p>
                  Voto popular não é referendum técnico — é “quem
                  empolgou”. Conta como categoria separada,{" "}
                  <em>Escolha do Público</em>.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Erro fica auditável</h3>
                <p>
                  Toda nota da IA tem reasoning + evidências citadas. Se
                  achou injusta, abre uma issue no GitHub do hackathon com
                  a evidência contrária. A gente volta a olhar.
                </p>
              </div>
            </div>
          </section>

          <section className="jg-rules" aria-label="Perguntas frequentes">
            <h2 className="jg-section-title">Perguntas frequentes</h2>
            <div className="ev-faq">
              <Faq
                q="A IA pode estar errada?"
                a="Sim. Por isso o ranking final é humano. A IA acerta o consistente, o humano corrige o esquisito."
              />
              <Faq
                q="Por que Claude Sonnet?"
                a="Bom em raciocínio estruturado em PT-BR, tem janela de contexto larga (cabe screenshot + README junto), e segue schema JSON com instrução simples. Não é endosso — é escolha técnica pra este evento."
              />
              <Faq
                q="Onde vejo as notas dos meus projetos?"
                a={
                  <>
                    Resultados ficam públicos em 12/05 às 17:00, na{" "}
                    <Link href="/resultados" className="ed-link">
                      tela de resultados
                    </Link>
                    . Cada nota vem com o reasoning da IA + ajustes dos
                    juízes humanos.
                  </>
                }
              />
              <Faq
                q="Quero votar — como funciona?"
                a={
                  <>
                    Entra em{" "}
                    <Link href="/juri-popular" className="ed-link">
                      júri popular
                    </Link>{" "}
                    com seu email, vê cada projeto com screenshots, demo e
                    descrição, dá 1–5 estrelas. Pode mudar até o fim das
                    apresentações.
                  </>
                }
              />
              <Faq
                q="A IA viu meu vídeo?"
                a="Se você enviou link válido, sim — em forma de frames + transcrição. Se for um link privado, ela não conseguiu abrir, e a nota de vibe/viabilidade caiu junto."
              />
            </div>
          </section>

          <footer className="jg-foot">
            <p>
              <em>IA julga. Humanos decidem. Plateia escolhe o favorito.</em>{" "}
              Resultados em <span className="t-mono-num">12/05 · 17:00</span>.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  hint,
}: {
  value: number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="ev-stat">
      <div className="ev-stat-value t-mono-num">
        {String(value).padStart(2, "0")}
      </div>
      <div className="ev-stat-label">{label}</div>
      {hint && <div className="ev-stat-hint">{hint}</div>}
    </div>
  );
}

function DimensionCard({
  dim,
  index,
}: {
  dim: DimensionPublic;
  index: number;
}) {
  const label = DIMENSION_LABELS[dim.key];
  return (
    <section
      className="jg-dim ev-dim"
      id={dim.key}
      aria-labelledby={`${dim.key}-h`}
    >
      <header className="jg-dim-head">
        <div className="jg-dim-num t-mono-num">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="jg-dim-titlewrap">
          <div className="t-eyebrow">dimensão · {label.sub}</div>
          <h3 id={`${dim.key}-h`} className="jg-dim-title">
            {label.label}.
          </h3>
          <p className="jg-dim-oneliner">&ldquo;{dim.question}&rdquo;</p>
        </div>
      </header>

      <p className="jg-dim-intro">{dim.intro}</p>

      <div className="ev-dim-cols">
        <div className="jg-col">
          <h4 className="t-eyebrow jg-col-head">onde olhar</h4>
          <ul className="jg-list">
            {dim.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
        <div className="jg-col jg-col-pros">
          <h4 className="t-eyebrow jg-col-head">o que conta</h4>
          <ul className="jg-list">
            {dim.pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="ev-faq-row">
      <h3 className="ev-faq-q">{q}</h3>
      <p className="ev-faq-a">{a}</p>
    </div>
  );
}
