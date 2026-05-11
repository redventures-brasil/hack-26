"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/judge";

  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!password.trim()) {
      setError(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/judge/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(true);
        setSubmitting(false);
        return;
      }
      router.push(next.startsWith("/judge") ? next : "/judge");
      router.refresh();
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <form
      className="login-card"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>
        entrada do júri
      </div>
      <h2 className="t-edit-h2" style={{ margin: "4px 0 8px" }}>
        Senha do evento.
      </h2>
      <p
        className="muted-2 t-small"
        style={{ margin: "0 0 36px", lineHeight: 1.5 }}
      >
        Compartilhada antes do hackathon. Não tem &ldquo;esqueci a
        senha&rdquo; — escreve no Discord que a gente reenvia.
      </p>

      <div className="ed-field">
        <label htmlFor="pw">senha</label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          style={error ? { borderBottomColor: "#FF6B6B" } : undefined}
          autoFocus
          disabled={submitting}
        />
        {error && (
          <div className="err" style={{ color: "#FF6B6B" }}>
            senha inválida. ainda dá tempo de pedir no #hack26-judges.
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          type="submit"
          className="ed-btn primary"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={submitting}
        >
          {submitting ? "Entrando…" : "Entrar"}
          <span className="arrow">→</span>
        </button>
      </div>
    </form>
  );
}
