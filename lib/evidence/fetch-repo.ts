/**
 * Pull lightweight repo evidence from GitHub via the public REST API.
 * Works for public repos without auth. Set GITHUB_TOKEN to raise the
 * 60 req/hour anonymous rate limit to 5000.
 */

export type RepoEvidence = {
  owner: string;
  repo: string;
  exists: boolean;
  error?: string;
  description: string | null;
  defaultBranch: string | null;
  language: string | null;
  stars: number;
  pushedAt: string | null;
  readme: string | null;
  fileTree: string[]; // up to ~50 entries
  commitsCount: number | null;
};

const GH = "https://api.github.com";

function parseUrl(input: string): { owner: string; repo: string } | null {
  // Accept "github.com/x/y", "https://github.com/x/y", "git@github.com:x/y"
  let u = input.trim();
  u = u.replace(/^https?:\/\//, "").replace(/^git@github\.com:/, "github.com/");
  const m = u.match(/^github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    "user-agent": "hack26-evaluator",
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export async function fetchRepoEvidence(
  githubUrl: string,
): Promise<RepoEvidence> {
  const parsed = parseUrl(githubUrl);
  if (!parsed) {
    return blank({
      error: "url_inválida — não consegui identificar dono/repositório.",
    });
  }
  const { owner, repo } = parsed;

  const baseRes = await fetch(`${GH}/repos/${owner}/${repo}`, {
    headers: ghHeaders(),
    // no-store: respostas de GitHub mudam de fato durante o evento
    // (repos privados ganhando scope, repos novos sendo pushed) e
    // o Next data-cache estava segurando 404s antigos depois do PAT
    // ser ajustado.
    cache: "no-store",
  }).catch((err) => {
    console.error(`[fetchRepoEvidence] ${owner}/${repo} threw`, err);
    return null;
  });

  if (!baseRes) {
    return blank({ owner, repo, error: "falha de rede ao chamar github." });
  }
  if (baseRes.status === 404) {
    return blank({
      owner,
      repo,
      error:
        "o repositório está privado ou não existe. Como o avaliador é um agente, ele precisa de acesso público.",
    });
  }
  if (!baseRes.ok) {
    return blank({
      owner,
      repo,
      error: `github respondeu ${baseRes.status}.`,
    });
  }
  const base = (await baseRes.json()) as {
    description: string | null;
    default_branch: string;
    language: string | null;
    stargazers_count: number;
    pushed_at: string | null;
  };

  // README (base64 in `.content`)
  let readme: string | null = null;
  const rmRes = await fetch(`${GH}/repos/${owner}/${repo}/readme`, {
    headers: ghHeaders(),
    cache: "no-store",
  }).catch(() => null);
  if (rmRes?.ok) {
    const j = (await rmRes.json()) as { content: string; encoding: string };
    if (j.encoding === "base64") {
      try {
        readme = Buffer.from(j.content, "base64").toString("utf8").slice(0, 12_000);
      } catch {
        readme = null;
      }
    }
  }

  // File tree (default branch, recursive=1 with cap)
  let fileTree: string[] = [];
  const treeRes = await fetch(
    `${GH}/repos/${owner}/${repo}/git/trees/${base.default_branch}?recursive=1`,
    { headers: ghHeaders(), next: { revalidate: 300 } },
  ).catch(() => null);
  if (treeRes?.ok) {
    const j = (await treeRes.json()) as {
      tree: { path: string; type: string }[];
    };
    fileTree = j.tree
      .filter((e) => e.type === "blob")
      .map((e) => e.path)
      .filter(
        (p) =>
          !p.startsWith("node_modules/") &&
          !p.startsWith(".next/") &&
          !p.startsWith("dist/") &&
          !p.startsWith("build/"),
      )
      .slice(0, 60);
  }

  // commits count is expensive (paginate Link header), skip and approximate
  return {
    owner,
    repo,
    exists: true,
    description: base.description,
    defaultBranch: base.default_branch,
    language: base.language,
    stars: base.stargazers_count,
    pushedAt: base.pushed_at,
    readme,
    fileTree,
    commitsCount: null,
  };
}

function blank(over: Partial<RepoEvidence> & { owner?: string; repo?: string }): RepoEvidence {
  return {
    owner: over.owner ?? "",
    repo: over.repo ?? "",
    exists: false,
    error: over.error,
    description: null,
    defaultBranch: null,
    language: null,
    stars: 0,
    pushedAt: null,
    readme: null,
    fileTree: [],
    commitsCount: null,
  };
}
