// lib/scorer.ts

const PRODUCT_KEYWORDS = [
  "protocol",
  "sdk",
  "framework",
  "infrastructure",
  "indexer",
  "rpc",
  "node",
  "wallet",
  "smart contract",
  "defi",
  "exchange",
  "lending",
  "amm",
  "cli",
  "api",
  "engine",
  "platform",
  "game",
  "ai",
  "agent",
  "privacy",
  "zk",
  "encryption",
  "payments",
  "finance"
];

const JUNK_KEYWORDS = [
  "tutorial",
  "example",
  "sample",
  "demo",
  "test",
  "learning",
  "course",
  "homework",
  "assignment",
  "script",
  "bot"
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  crypto: ["crypto", "web3", "blockchain", "defi", "evm", "solidity"],
  finance: ["finance", "lending", "dex", "exchange", "trading", "payments"],
  infra: ["infra", "sdk", "rpc", "indexer", "node", "framework"],
  ai: ["ai", "ml", "llm", "agent"],
  privacy: ["privacy", "zk", "encryption"],
  games: ["game", "gaming", "nft"]
};

const ENTERPRISE_KEYWORDS = [
  "foundation",
  "labs",
  "company",
  "corp",
  "inc",
  "org"
];

function blob(repo: any) {
  return `${repo.name} ${repo.description || ""}`.toLowerCase();
}

export function isJunkRepo(repo: any) {
  const text = blob(repo);
  return JUNK_KEYWORDS.some((k) => text.includes(k));
}

export function isEnterpriseRepo(repo: any) {
  const text = blob(repo);
  return ENTERPRISE_KEYWORDS.some((k) => text.includes(k));
}

export function inferCategories(repo: any): string[] {
  const text = blob(repo);

  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keys]) => keys.some((k) => text.includes(k)))
    .map(([c]) => c);
}

export function scoreRepo(repo: any): number {
  if (isJunkRepo(repo)) return 0;

  let score = 0;
  const text = blob(repo);

  PRODUCT_KEYWORDS.forEach((k) => {
    if (text.includes(k)) score += 5;
  });

  if (repo.description && repo.description.length > 40) score += 15;
  if (repo.stargazers_count >= 3) score += 10;
  if (repo.forks_count > 0) score += 5;

  const days =
    (Date.now() - new Date(repo.updated_at).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days < 30) score += 15;
  else if (days < 90) score += 10;

  if (inferCategories(repo).length > 0) score += 10;

  return score;
}

export function generateCoinReason(repo: any): string[] {
  const cats = inferCategories(repo);
  const reasons: string[] = [];

  if (cats.includes("infra")) reasons.push("Core developer infrastructure");
  if (cats.includes("finance")) reasons.push("Touches real financial flows");
  if (cats.includes("crypto")) reasons.push("Crypto-native architecture");
  if (cats.includes("ai")) reasons.push("AI-powered product logic");

  reasons.push("Built by an independent builder");

  return reasons.slice(0, 4);
}

export function generateCoinThesis(repo: any) {
  const cats = inferCategories(repo);
  const primary = cats[0] || "crypto";

  return {
    name: repo.name,
    symbol: repo.name.replace(/[^A-Z]/gi, "").slice(0, 5).toUpperCase(),
    thesis: `Backing an early-stage builder shipping a real ${primary} product. This coin exists to support long-term development, not hype.`
  };
}
