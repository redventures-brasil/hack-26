/**
 * Judge auth — single shared password, HttpOnly cookie.
 *
 * No user accounts. The judge enters the event password at /judge/login;
 * the API sets `hack26_judge=ok` for 12h. middleware.ts checks the cookie
 * on every /judge/* request (except /judge/login).
 *
 * Substituir por Clerk/Auth.js quando virar produção de verdade.
 */

export const JUDGE_COOKIE = "hack26_judge";
export const JUDGE_COOKIE_VALUE = "ok"; // we don't carry a userid — gate-only
export const JUDGE_COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

export function getJudgePassword(): string {
  return process.env.JUDGE_PASSWORD ?? "hack26";
}

export function checkPassword(input: string): boolean {
  if (!input) return false;
  return input.trim() === getJudgePassword();
}
