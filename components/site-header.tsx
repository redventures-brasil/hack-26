"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Variant = "public" | "judge";

type Props = {
  variant?: Variant;
  current?: "submit" | "votar" | "avaliacao" | "guia" | "ranking";
};

export function SiteHeader({ variant = "public", current }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/judge/logout", { method: "POST" });
    router.push("/judge/login");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="hstack gap-4">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>
          <Image
            src="/hack26-logo.webp"
            alt="HACK-26"
            width={2000}
            height={599}
            priority
            unoptimized
            className="logo-img"
          />
        </Link>
        {variant === "judge" && (
          <span className="t-eyebrow" style={{ marginLeft: 16 }}>
            painel dos juízes
          </span>
        )}
      </div>

      {variant === "public" && (
        <nav>
          <Link href="/submit" className={current === "submit" ? "active" : ""}>
            Submeter
          </Link>
          <Link
            href="/juri-popular"
            className={current === "votar" ? "active" : ""}
          >
            Votar
          </Link>
          <Link
            href="/avaliacao"
            className={current === "avaliacao" ? "active" : ""}
          >
            Avaliação
          </Link>
          <Link href="/judge/login" className="ed-link">
            Sou juiz ↗
          </Link>
        </nav>
      )}

      {variant === "judge" && (
        <nav>
          <Link
            href="/judge"
            className={current === "ranking" ? "active" : ""}
          >
            Ranking
          </Link>
          <Link
            href="/judge/guia"
            className={current === "guia" ? "active" : ""}
          >
            Guia
          </Link>
          <button
            type="button"
            onClick={logout}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              color: "inherit",
              font: "inherit",
            }}
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  );
}
