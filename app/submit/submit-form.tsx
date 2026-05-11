"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Uploaded = { url: string; name: string; sizeLabel: string };

const DRAFT_KEY = "hack26.submit-draft.v1";

type DraftValues = {
  teamName: string;
  projectName: string;
  description: string;
  githubUrl: string;
  demoUrl: string;
};

function readDraft(): DraftValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftValues) : null;
  } catch {
    return null;
  }
}

function persistDraft(v: DraftValues): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SubmitForm() {
  const router = useRouter();
  const [values, setValues] = useState<DraftValues>(() => ({
    teamName: "",
    projectName: "",
    description: "",
    githubUrl: "",
    demoUrl: "",
  }));
  const [video, setVideo] = useState<Uploaded | null>(null);
  const [shots, setShots] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState<"video" | "image" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Hydrate from localStorage on mount. This is the canonical "sync
  // external state into React" pattern — the lint rule fires anyway.
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(draft);
  }, []);

  const update = useCallback(
    (key: keyof DraftValues, val: string) => {
      setValues((prev) => {
        const next = { ...prev, [key]: val };
        persistDraft(next);
        return next;
      });
    },
    [],
  );

  async function uploadFile(
    file: File,
    kind: "video" | "image",
  ): Promise<Uploaded | null> {
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(`upload falhou: ${j.error ?? res.status}`);
        return null;
      }
      const j = (await res.json()) as { url: string; size: number };
      return { url: j.url, name: file.name, sizeLabel: fmtSize(j.size) };
    } catch (e) {
      setServerError(`upload falhou: ${(e as Error).message}`);
      return null;
    } finally {
      setUploading(null);
    }
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const u = await uploadFile(f, "video");
    if (u) setVideo(u);
  }

  async function onShotsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(
      0,
      Math.max(0, 5 - shots.length),
    );
    if (files.length === 0) return;
    const uploaded: Uploaded[] = [];
    for (const f of files) {
      const u = await uploadFile(f, "image");
      if (u) uploaded.push(u);
    }
    if (uploaded.length) setShots((s) => [...s, ...uploaded]);
  }

  const isValid =
    values.teamName.trim().length > 0 &&
    values.projectName.trim().length > 0 &&
    values.description.trim().length >= 50 &&
    values.githubUrl.trim().length > 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teamName: values.teamName.trim(),
          projectName: values.projectName.trim(),
          description: values.description.trim(),
          githubUrl: values.githubUrl.trim(),
          demoUrl: values.demoUrl.trim() || null,
          videoUrl: video?.url ?? null,
          screenshotUrls: shots.map((s) => s.url),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(j.error ?? `erro ${res.status}`);
        setSubmitting(false);
        return;
      }
      const j = (await res.json()) as { id: string };
      clearDraft();
      router.push(`/submit/${j.id}`);
    } catch (e) {
      setServerError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="sub-grid">
        <div className="ed-field">
          <div className="label-row">
            <label htmlFor="team">nome do time</label>
            <span className="req">obrigatório</span>
          </div>
          <input
            id="team"
            type="text"
            value={values.teamName}
            onChange={(e) => update("teamName", e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div className="ed-field">
          <div className="label-row">
            <label htmlFor="project">nome do projeto</label>
            <span className="req">obrigatório</span>
          </div>
          <input
            id="project"
            type="text"
            value={values.projectName}
            onChange={(e) => update("projectName", e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div className="ed-field full">
          <div className="label-row">
            <label htmlFor="desc">descrição</label>
            <span className="t-mono-num muted" style={{ fontSize: 11 }}>
              {values.description.length} / 800
            </span>
          </div>
          <textarea
            id="desc"
            rows={5}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            required
            minLength={50}
            maxLength={800}
            placeholder="Que problema vocês resolveram, pra quem, e por que importa."
          />
          <div className="hint">
            Que problema vocês resolveram, pra quem, e por que importa. 50–800
            chars.
          </div>
        </div>

        <div className="ed-field">
          <label htmlFor="github">repositório github</label>
          <input
            id="github"
            type="url"
            value={values.githubUrl}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="github.com/usuario/repo"
            required
          />
          <div className="hint">
            deve ser público — vamos clonar pra avaliar.
          </div>
        </div>

        <div className="ed-field">
          <label htmlFor="demo">demo deployado</label>
          <input
            id="demo"
            type="url"
            value={values.demoUrl}
            onChange={(e) => update("demoUrl", e.target.value)}
            placeholder="meu-projeto.vercel.app"
          />
          <div className="hint">opcional. abre no navegador.</div>
        </div>

        <div className="ed-field full">
          <div className="label-row">
            <label>vídeo de pitch · opcional</label>
            <span className="t-mono-num muted" style={{ fontSize: 11 }}>
              ≤ 500MB · .mp4 .mov
            </span>
          </div>
          {video ? (
            <div className="dz video uploaded">
              <div className="dz-thumb video-thumb">
                <div className="play">▶</div>
                <div className="dz-thumb-grain" />
              </div>
              <div className="dz-meta">
                <div className="dz-name">{video.name}</div>
                <div className="dz-sub t-mono-num">
                  {video.sizeLabel} · uploaded
                </div>
              </div>
              <button
                type="button"
                className="dz-remove"
                onClick={() => setVideo(null)}
              >
                remover
              </button>
            </div>
          ) : (
            <label className="dz video empty" style={{ cursor: "pointer" }}>
              <div className="dz-icon">↑</div>
              <div className="dz-text">
                <strong>
                  {uploading === "video" ? "Subindo…" : "Escolha o vídeo"}
                </strong>
              </div>
              <div className="dz-hint">.mp4 / .mov · até 500 MB</div>
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={onVideoChange}
                style={{ display: "none" }}
                disabled={uploading != null}
              />
            </label>
          )}
        </div>

        <div className="ed-field full">
          <div className="label-row">
            <label>screenshots · opcional · 1–5</label>
            <span className="t-mono-num muted" style={{ fontSize: 11 }}>
              ≤ 10MB cada
            </span>
          </div>
          {shots.length > 0 ? (
            <div className="dz images uploaded">
              <div className="img-grid">
                {shots.map((s, i) => (
                  <div className="img-tile" key={s.url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.url}
                      alt={s.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      className="img-remove"
                      aria-label={`remover ${i + 1}`}
                      onClick={() =>
                        setShots((arr) => arr.filter((x) => x.url !== s.url))
                      }
                    >
                      ×
                    </button>
                    <div className="img-name t-mono-num">{s.name}</div>
                  </div>
                ))}
                {shots.length < 5 && (
                  <label className="img-tile add" style={{ cursor: "pointer" }}>
                    <div className="img-add">＋</div>
                    <div className="img-add-text">adicionar mais</div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onShotsChange}
                      style={{ display: "none" }}
                      disabled={uploading != null}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <label className="dz images empty" style={{ cursor: "pointer" }}>
              <div className="dz-icon">↑</div>
              <div className="dz-text">
                <strong>
                  {uploading === "image"
                    ? "Subindo…"
                    : "Escolha 1 a 5 imagens"}
                </strong>
              </div>
              <div className="dz-hint">.png / .jpg / .webp · até 10 MB cada</div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onShotsChange}
                style={{ display: "none" }}
                disabled={uploading != null}
              />
            </label>
          )}
        </div>
      </div>

      {serverError && (
        <div
          className="ed-field"
          style={{ marginTop: 28, color: "#FF6B6B" }}
        >
          <div className="err">{serverError}</div>
        </div>
      )}

      <footer className="sub-foot">
        <div className="hint">
          <span className="t-mono-num">autosave</span> · salvamos no seu
          navegador a cada blur. fechou a aba sem querer? não perde.
        </div>
        <div className="hstack gap-4">
          <button
            type="button"
            className="ed-btn"
            onClick={() => {
              clearDraft();
              setValues({
                teamName: "",
                projectName: "",
                description: "",
                githubUrl: "",
                demoUrl: "",
              });
              setVideo(null);
              setShots([]);
            }}
            disabled={submitting}
          >
            Limpar rascunho
          </button>
          <button
            type="submit"
            className="ed-btn primary"
            disabled={!isValid || submitting || uploading != null}
          >
            {submitting ? "Enviando…" : "Enviar"}
            <span className="arrow">→</span>
          </button>
        </div>
      </footer>
    </form>
  );
}
