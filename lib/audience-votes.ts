/**
 * Júri popular — anonymous device-bound vote storage.
 *
 * Voto = 1–5 estrelas por projeto, persistido em localStorage. Não há
 * usuário; a "identidade" é o aparelho (uma chave gerada e mantida).
 * Pra MVP do hackathon isso é o bastante — substituir por cookie HTTPOnly
 * + endpoint /api/votes quando virar produção.
 */

const KEY = "hack26.popular-votes.v1";
const DEVICE_KEY = "hack26.device-id";
const EVENT_KEY = "hack26.event-code";
const EMAIL_KEY = "hack26.voter-email";

export type VoteMap = Record<string, number>; // teamId -> 1..5

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getDeviceId(): string {
  if (!isBrowser()) return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getEventCode(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(EVENT_KEY);
}

export function setEventCode(code: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(EVENT_KEY, code.trim().toUpperCase());
}

export function clearEventCode(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(EVENT_KEY);
}

export function getEmail(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function setEmail(email: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

export function clearEmail(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(EMAIL_KEY);
}

export function getVotes(): VoteMap {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VoteMap) : {};
  } catch {
    return {};
  }
}

export function setVote(teamId: string, stars: number): VoteMap {
  if (!isBrowser()) return {};
  const next = { ...getVotes(), [teamId]: Math.max(1, Math.min(5, stars)) };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearVote(teamId: string): VoteMap {
  if (!isBrowser()) return {};
  const next = { ...getVotes() };
  delete next[teamId];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
