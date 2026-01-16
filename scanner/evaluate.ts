import { RawRepo } from "./types";

const PRODUCT_KEYWORDS = [
  "app",
  "platform",
  "tool",
  "service",
  "sdk",
  "engine",
  "cli",
  "api",
  "dashboard",
  "server",
  "client"
];

const CRYPTO_KEYWORDS = [
  "crypto",
  "web3",
  "blockchain",
  "defi",
  "wallet",
  "dao",
  "token",
  "zk",
  "privacy"
];

const AI_KEYWORDS = ["ai", "ml", "llm", "agent"];

const HARD_JUNK = [
  "cheatsheet",
  "roadmap",
  "course",
  "tutorial-series"
];

function text(repo: RawRepo) {
  return `${repo.name} ${repo.description || ""}`.toLowerCase();
}

export function evaluateRepo(repo: RawRepo) {
  const t = text(repo);

  // ❌ only absolute rejects
  if (repo.owner.type !== "User") {
    return null;
  }

  if (HARD_JUNK.some(k => t.includes(k))) {
    return null;
  }

  const hasProduct = PRODUCT_KEYWORDS.some(k => t.includes(k));
  const isCrypto = CRYPTO_KEYWORDS.some(k => t.includes(k));
  const isAI = AI_KEYWORDS.some(k => t.includes(k));

  let score = 0;

  if (hasProduct) score += 20;
  if (isCrypto) score += 20;
  if (isAI) score += 10;

  if (repo.stargazers_count >= 1) score += 5;
  if (repo.forks_count > 0) score += 5;

  const days =
    (Date.now() - new Date(repo.pushed_at).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days < 30) score += 15;
  else if (days < 180) score += 10;

  const coinWorthy =
    score >= 60 &&
    (hasProduct || isCrypto) &&
    repo.stargazers_count >= 5;

  return {
    score,
    categories: [
      ...(isCrypto ? ["crypto"] : []),
      ...(isAI ? ["ai"] : [])
    ],
    coinWorthy
  };
}
