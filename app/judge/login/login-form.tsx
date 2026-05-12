"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ErrorState = null | "email" | "password" | "generic";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/judge";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ErrorState>(null);
  const [submitting, setSubmitting] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function submit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("email");
      return;
    }
    if (!password.trim()) {
      setError("password");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/judge/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      if (!res.ok) {
        let reason: ErrorState = "generic";
        try {
          const body = (await res.json()) as { reason?: string };
          if (body.reason === "email") reason = "email";
          else if (body.reason === "password") reason = "password";
        } catch {
          /* fall back to generic */
        }
        setError(reason);
        setSubmitting(false);
        return;
      }
      router.push(next.startsWith("/judge") ? next : "/judge");
      router.refresh();
    } catch {
      setError("generic");
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
        Email e senha.
      </h2>
      <p
        className="muted-2 t-small"
        style={{ margin: "0 0 36px", lineHeight: 1.5 }}
      >
        Email serve pra registrar quem julgou. A senha é compartilhada antes
        do hackathon — sem &ldquo;esqueci a senha&rdquo;, fala no Discord que
        a gente reenvia.
      </p>

      <div className="ed-field">
        <label htmlFor="judge-email">email</label>
        <input
          id="judge-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          maxLength={120}
          autoFocus
          disabled={submitting}
          style={error === "email" ? { borderBottomColor: "#FF6B6B" } : undefined}
        />
        {error === "email" && (
          <div className="err" style={{ color: "#FF6B6B" }}>
            coloca um email válido.
          </div>
        )}
      </div>

      <div className="ed-field" style={{ marginTop: 20 }}>
        <label htmlFor="pw">senha</label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="current-password"
          disabled={submitting}
          style={
            error === "password" || error === "generic"
              ? { borderBottomColor: "#FF6B6B" }
              : undefined
          }
        />
        {error === "password" && (
          <div className="err" style={{ color: "#FF6B6B" }}>
            senha inválida. ainda dá tempo de pedir no #hack26-judges.
          </div>
        )}
        {error === "generic" && (
          <div className="err" style={{ color: "#FF6B6B" }}>
            algo deu errado. tenta de novo.
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
