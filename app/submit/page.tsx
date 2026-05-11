import { SiteHeader } from "@/components/site-header";
import { SubmitForm } from "./submit-form";

export const metadata = {
  title: "HACK-26 · Submeter projeto",
};

export default function SubmitPage() {
  return (
    <div className="page">
      <SiteHeader variant="public" current="submit" />
      <div className="sub-stage page-body">
        <div className="sub-shell">
          <header className="sub-head">
            <div className="t-eyebrow">passo 01 de 01 · submissão</div>
            <h2 className="t-edit-h1">Submeta o projeto.</h2>
            <p
              className="muted-2"
              style={{ fontSize: 15, maxWidth: 520, lineHeight: 1.55 }}
            >
              A IA precisa de todo o material pra avaliar nas 4 dimensões.
              Quanto mais evidência, melhor o feedback. Você consegue editar
              até a fila começar.
            </p>
          </header>

          <SubmitForm />
        </div>
      </div>
    </div>
  );
}
