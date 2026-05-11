import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="page">
      <SiteHeader variant="judge" />
      <div className="err-stage page-body">
        <div className="err-shell">
          <div className="err-num t-edit-display italic">404.</div>
          <h2 className="t-edit-h1" style={{ margin: "0 0 12px" }}>
            Submissão não existe.
          </h2>
          <p
            className="t-edit-quote muted-2"
            style={{ margin: "0 0 32px", maxWidth: 480 }}
          >
            Talvez o time tenha apagado, talvez a URL veio errada de algum
            canal. Não é catástrofe.
          </p>
          <Link href="/judge" className="ed-btn">
            ← voltar pro ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
