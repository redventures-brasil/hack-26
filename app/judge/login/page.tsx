import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "HACK-26 · Entrada do júri",
};

export default function JudgeLoginPage() {
  return (
    <div className="page">
      <div className="login-stage page-body">
        <div className="login-shell">
          <div className="login-logo">
            <Image
              src="/hack26-logo.webp"
              alt="HACK-26"
              width={2000}
              height={599}
              priority
              unoptimized
              className="login-logo-img"
            />
            <span className="t-eyebrow login-logo-tag">painel privado</span>
          </div>

          <Suspense
            fallback={
              <div
                className="login-card"
                style={{ minHeight: 320 }}
                aria-busy="true"
              />
            }
          >
            <LoginForm />
          </Suspense>

          <div className="login-foot">
            <span className="muted">R2 Ventures · hack26.r2.ventures</span>
          </div>
        </div>
      </div>
    </div>
  );
}
