import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "HACK-26 · Grupos",
  description: "Os times do HACK-26 e seus pontos focais.",
};

type Member = { email: string };
type Group = { num: number; members: Member[] };

const GROUPS: Group[] = [
  {
    num: 1,
    members: [
      { email: "thalison.morais@r2ventures.com.br" },
      { email: "nathalia.lusquinos@r2ventures.com.br" },
      { email: "beatriz.gomes@r2ventures.com.br" },
    ],
  },
  {
    num: 2,
    members: [
      { email: "gabriel.zuza@r2ventures.com.br" },
      { email: "alexandre.tsunoda@r2ventures.com.br" },
      { email: "bruna.guimaraes@r2ventures.com.br" },
      { email: "murilo.sopi@r2ventures.com.br" },
    ],
  },
  {
    num: 3,
    members: [
      { email: "matheus.albino@r2ventures.com.br" },
      { email: "pedro.viana@r2ventures.com.br" },
      { email: "daniel.santos@r2ventures.com.br" },
    ],
  },
  {
    num: 4,
    members: [
      { email: "miqueias.moureira@r2ventures.com.br" },
      { email: "isadora.luize@r2ventures.com.br" },
      { email: "kleber.zanella@r2ventures.com.br" },
    ],
  },
  {
    num: 5,
    members: [
      { email: "ana.marques@r2ventures.com.br" },
      { email: "ryan.alves@r2ventures.com.br" },
      { email: "ricardo.barreto@r2ventures.com.br" },
      { email: "pedro.dalinghaus@r2ventures.com.br" },
    ],
  },
  {
    num: 6,
    members: [
      { email: "tiago.palte@r2ventures.com.br" },
      { email: "dico.gomes@r2ventures.com.br" },
      { email: "bruno.rocca@r2ventures.com.br" },
    ],
  },
  {
    num: 7,
    members: [
      { email: "michel.freitas@r2ventures.com.br" },
      { email: "julia.menezes@r2ventures.com.br" },
      { email: "rafael.dias@r2ventures.com.br" },
    ],
  },
  {
    num: 8,
    members: [
      { email: "gabriel.morth@r2ventures.com.br" },
      { email: "thais.varela@r2ventures.com.br" },
      { email: "renato.bongiovanni@r2ventures.com.br" },
    ],
  },
];

function humanizeName(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function GruposPage() {
  const totalPeople = GROUPS.reduce((acc, g) => acc + g.members.length, 0);
  return (
    <div className="page">
      <SiteHeader variant="public" current="grupos" />
      <div className="page-body">
        <article className="jg-stage">
          <header className="jg-hero">
            <div className="t-eyebrow">times · hack-26</div>
            <h1 className="jg-title">
              Os <em>grupos</em>.
            </h1>
            <p className="jg-lede">
              {GROUPS.length} times, {totalPeople} pessoas no total.
            </p>
            <div className="cf-stat-strip">
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(GROUPS.length).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">grupos</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(totalPeople).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">pessoas</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">04</span>
                <span className="cf-stat-label">dimensões</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">3h30</span>
                <span className="cf-stat-label">pra entregar</span>
              </div>
            </div>
          </header>

          <section aria-label="Lista de grupos">
            <div className="gr-grid">
              {GROUPS.map((g) => (
                <article className="gr-card" key={g.num}>
                  <header className="gr-card-head">
                    <span className="gr-card-num t-mono-num">
                      {String(g.num).padStart(2, "0")}
                    </span>
                    <span className="gr-card-label t-eyebrow">grupo</span>
                  </header>
                  <ul className="gr-members">
                    {g.members.map((m) => (
                      <li key={m.email} className="gr-member">
                        <span className="gr-member-name">
                          {humanizeName(m.email)}
                        </span>
                        <a
                          href={`mailto:${m.email}`}
                          className="gr-member-email"
                        >
                          {m.email}
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}
