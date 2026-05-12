import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "HACK-26 · Como funciona",
  description:
    "Vibethon de 3h30. Tema livre. IA julga, humanos decidem. Como participar, o que entregar e oito ideias caso a mente trave.",
};

type ThemeIdea = {
  key: string;
  eyebrow: string;
  title: string;
  pitch: string;
  explore: string[];
};

const IDEAS: ThemeIdea[] = [
  {
    key: "claudia-voz",
    eyebrow: "voz · suporte humano",
    title: "ClaudIA de ligações",
    pitch:
      "Atendente por voz no telefone. Recebe a ligação, entende o pedido, responde ou transfere pra humano com contexto resumido. Latência baixa, fala como gente.",
    explore: ["Twilio · Vapi", "tool-use em tempo real", "barge-in · turn-taking"],
  },
  {
    key: "search",
    eyebrow: "search · retrieval",
    title: "Otimização de buscas na IA",
    pitch:
      "Como fazer a IA achar o que importa rápido? Re-rank, hybrid search, sparse vs dense, indexação que cabe no contexto sem inchar.",
    explore: ["embedding + BM25", "re-ranker (Cohere, Voyage)", "chunking estratégico"],
  },
  {
    key: "vendas",
    eyebrow: "comercial · fechamento",
    title: "Vendas por IA",
    pitch:
      "Lead chega frio, o agente conversa, qualifica, propõe — e só passa pro humano quando vale. Ou fecha sozinho até onde der.",
    explore: ["lead scoring", "hand-off com contexto", "integração com CRM/checkout"],
  },
  {
    key: "secops",
    eyebrow: "secops · vulnerabilidade",
    title: "Automatizar SecInfo",
    pitch:
      "Lê CVEs do Wiz, prioriza pela severidade real (não a do CVSS papel), abre PR com a correção sugerida. Engenheiro revisa e dá merge.",
    explore: ["Wiz API", "CVSS contextual", "auto-PR com diff"],
  },
  {
    key: "fiscal",
    eyebrow: "fiscal · operação",
    title: "RPAs e Notas",
    pitch:
      "Emitir RPA, coletar assinatura digital, arquivar. Receber nota de fornecedor, validar campos, classificar. Tirar o operacional do humano sem perder rastreabilidade.",
    explore: ["assinatura digital", "OCR + extração estruturada", "validação fiscal"],
  },
  {
    key: "red-testing",
    eyebrow: "qualidade · iteração",
    title: "AI red testing",
    pitch:
      "IA propõe variantes de copy/UI/landing, mede resultado, propõe o próximo ajuste. Sabe quando parar — o teste atingiu significância ou plateau.",
    explore: ["multi-armed bandit", "significância sequencial", "loop fechado de feedback"],
  },
  {
    key: "tracr",
    eyebrow: "analytics · tempo-real",
    title: "Tracr insights",
    pitch:
      "Lê o stream do Tracr enquanto a reunião acontece. Detecta padrão, vira insight, joga no Slack/Teams pro time agir agora — não no review do mês seguinte.",
    explore: ["streaming events", "análise contínua", "alerting acionável"],
  },
  {
    key: "recrutamento",
    eyebrow: "people · pipeline",
    title: "Agente de recrutamento R2",
    pitch:
      "Recebe CV, prepara screening, agenda entrevista, registra feedback. Pega no topo do funil, libera o recrutador pra parte que é só humana.",
    explore: ["Greenhouse/Lever API", "email + calendário", "fit cultural assistido"],
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="page">
      <SiteHeader variant="public" current="como-funciona" />
      <div className="page-body">
        <article className="jg-stage">
          <header className="jg-hero">
            <div className="t-eyebrow">regras · hack-26</div>
            <h1 className="jg-title">
              Como <em>funciona</em>.
            </h1>
            <p className="jg-lede">
              12 de maio · 13:30–17:00 · R2 Ventures. Três horas e meia pra
              construir algo que prove um ponto. Tema livre — IA, automação,
              produto, ferramenta interna, side-quest. Se a mente travar,
              tem oito ideias logo abaixo.
            </p>
            <div className="cf-stat-strip">
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">3h30</span>
                <span className="cf-stat-label">de construção</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">04</span>
                <span className="cf-stat-label">dimensões avaliadas</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">02</span>
                <span className="cf-stat-label">camadas de júri</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">17:00</span>
                <span className="cf-stat-label">resultado público</span>
              </div>
            </div>
          </header>

          <section aria-label="Como participar">
            <h2 className="jg-section-title">Como participar</h2>
            <ol className="ev-flow">
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">01</div>
                <div>
                  <h3 className="ev-step-head">Forma o time</h3>
                  <p>
                    Solo ou em grupo, do tamanho que fizer sentido. Sem
                    inscrição prévia formal — quem vier no horário tá dentro.
                  </p>
                </div>
              </li>
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">02</div>
                <div>
                  <h3 className="ev-step-head">Constrói 3h30</h3>
                  <p>
                    Stack livre, modelos livres (Claude, GPT, Gemini, o que
                    quiser). Vale usar Cursor, v0, Lovable, Copilot — vibe
                    coding é parte do jogo.
                  </p>
                </div>
              </li>
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">03</div>
                <div>
                  <h3 className="ev-step-head">Submete</h3>
                  <p>
                    Link do repositório, demo acessível, screenshots e (se
                    rolar) um vídeo curto explicando. A submissão fica em{" "}
                    <Link href="/submit" className="ed-link">
                      /submit
                    </Link>
                    .
                  </p>
                </div>
              </li>
              <li className="ev-step">
                <div className="ev-step-num t-mono-num">04</div>
                <div>
                  <h3 className="ev-step-head">Avaliação acontece</h3>
                  <p>
                    IA julga primeiro nas 4 dimensões, júri técnico refina,
                    plateia vota em paralelo no{" "}
                    <Link href="/juri-popular" className="ed-link">
                      júri popular
                    </Link>
                    . Resultado público às 17:00 em{" "}
                    <Link href="/resultados" className="ed-link">
                      /resultados
                    </Link>
                    .
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section aria-label="Tema livre + ideias">
            <h2 className="jg-section-title">Tema livre. Oito faíscas.</h2>
            <p
              className="jg-lede"
              style={{ marginTop: -4, marginBottom: 32 }}
            >
              Não tem briefing fechado — você decide o que construir. As
              ideias abaixo são <em>provocações</em>: dor real da R2 ou da
              indústria, com espaço pra inventar o jeito. Pegar e levar pra
              outro lado é bem-vindo.
            </p>

            <div className="cf-ideas">
              {IDEAS.map((i, idx) => (
                <article className="cf-idea" key={i.key}>
                  <header className="cf-idea-head">
                    <span className="cf-idea-num t-mono-num">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="t-eyebrow">{i.eyebrow}</span>
                  </header>
                  <h3 className="cf-idea-title">{i.title}</h3>
                  <p className="cf-idea-pitch">{i.pitch}</p>
                  <div className="cf-idea-explore">
                    <span className="t-eyebrow">explora</span>
                    <ul>
                      {i.explore.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jg-rules" aria-label="O que vale">
            <h2 className="jg-section-title">O que vale e o que não</h2>
            <div className="jg-rule-grid">
              <div className="jg-rule">
                <h3 className="jg-rule-head">Vale</h3>
                <p>
                  Reusar código, libraries open-source, templates,
                  starter-kits. Vibe coding com qualquer modelo. Trazer
                  pesquisa de antes — o relógio é só de construção, não de
                  pensar.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Não vale</h3>
                <p>
                  Submeter projeto já pronto (a essência tem que nascer no
                  evento). Plágio direto sem citar fonte. Demos forjadas
                  que não rodam — o juiz vai abrir.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Stack</h3>
                <p>
                  Qualquer linguagem, qualquer framework, qualquer cloud.
                  Local também serve, se a demo abrir no celular dos juízes.
                </p>
              </div>
              <div className="jg-rule">
                <h3 className="jg-rule-head">Premiação</h3>
                <p>
                  Top 3 escolhidos pelo júri técnico + Escolha do Público
                  (voto popular). Categorias separadas. Não-cumulativas.
                </p>
              </div>
            </div>
          </section>

          <section aria-label="Como é avaliado" className="jg-rules">
            <h2 className="jg-section-title">Como vai ser avaliado</h2>
            <p className="jg-lede" style={{ marginTop: 0 }}>
              Quatro dimensões: <strong>vibe</strong>, <strong>originalidade</strong>
              , <strong>execução técnica</strong>, <strong>viabilidade</strong>.
              Cada uma 0–10 com reasoning estruturado. Detalhe das rubricas
              e do processo IA + humanos em{" "}
              <Link href="/avaliacao" className="ed-link">
                /avaliacao
              </Link>
              .
            </p>
          </section>

          <footer className="jg-foot">
            <p>
              <em>Tema livre, tempo curto, evidência pública.</em> Quem
              quiser ver o ranking ao vivo do dia da apresentação fica em{" "}
              <Link href="/resultados" className="ed-link">
                /resultados
              </Link>
              .
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
