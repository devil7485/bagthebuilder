import { RawRepo } from "./types";

// Product indicators
const PRODUCT_KEYWORDS = [
  "app", "platform", "tool", "service", "sdk", "engine",
  "cli", "api", "dashboard", "server", "client", "framework",
  "protocol", "system", "network"
];

// Blockchain detection
const BLOCKCHAIN_KEYWORDS = {
  solana: ["solana", "sol", "spl", "metaplex", "anchor"],
  ethereum: ["ethereum", "eth", "evm", "erc20", "erc721"],
  base: ["base", "basescan"],
  polygon: ["polygon", "matic"],
  cosmos: ["cosmos", "cosmwasm"],
  bitcoin: ["bitcoin", "btc", "lightning"]
};

// Smart contract languages
const CONTRACT_LANGUAGES = {
  rust: ["rust", "cargo.toml"],
  solidity: ["solidity", ".sol", "hardhat", "foundry"],
  move: ["move", "aptos", "sui"]
};

// Web3 frameworks
const WEB3_FRAMEWORKS = [
  "anchor", "hardhat", "foundry", "truffle", "brownie",
  "cosmwasm", "near-sdk", "ink"
];

// Crypto categories
const CRYPTO_KEYWORDS = {
  defi: ["defi", "dex", "amm", "swap", "liquidity", "yield", "lending", "vault"],
  wallet: ["wallet", "custody", "multisig", "signer"],
  nft: ["nft", "token", "erc721", "erc1155", "metaplex"],
  mev: ["mev", "flashbots", "searcher", "arbitrage"],
  infra: ["rpc", "indexer", "validator", "node", "oracle"],
  dao: ["dao", "governance", "voting", "multisig"],
  bridge: ["bridge", "crosschain", "cross-chain", "interop"],
  privacy: ["privacy", "zk", "zero-knowledge", "zkp", "private"]
};

// AI keywords
const AI_KEYWORDS = [
  "ai", "ml", "llm", "gpt", "machine-learning", "neural",
  "agent", "chatbot", "assistant", "model", "rag"
];

// Games keywords
const GAMES_KEYWORDS = [
  "game", "gaming", "unity", "unreal", "godot", "phaser",
  "multiplayer", "nft-game", "gamefi"
];

// Infrastructure keywords
const INFRA_KEYWORDS = [
  "docker", "kubernetes", "k8s", "cloud", "serverless",
  "devops", "monitoring", "logging", "cicd"
];

// Quality indicators
const JUNK_PATTERNS = [
  "awesome-", "cheatsheet", "roadmap", "course", "tutorial",
  "learning", "my-first", "test-", "demo-", "example-",
  "hello-world", "portfolio", "resume"
];

function text(repo: RawRepo): string {
  return `${repo.name} ${repo.description || ""} ${repo.topics?.join(" ") || ""}`.toLowerCase();
}

// Detect blockchain
function detectBlockchain(repo: RawRepo): string[] {
  const t = text(repo);
  const chains: string[] = [];
  
  for (const [chain, keywords] of Object.entries(BLOCKCHAIN_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) {
      chains.push(chain);
    }
  }
  
  return chains;
}

// Detect smart contract language
function detectLanguage(repo: RawRepo): string | null {
  const t = text(repo);
  
  if (repo.language === "Rust" || CONTRACT_LANGUAGES.rust.some(k => t.includes(k))) {
    return "Rust";
  }
  if (repo.language === "Solidity" || CONTRACT_LANGUAGES.solidity.some(k => t.includes(k))) {
    return "Solidity";
  }
  if (CONTRACT_LANGUAGES.move.some(k => t.includes(k))) {
    return "Move";
  }
  
  return repo.language;
}

// Detect framework
function detectFramework(repo: RawRepo): string[] {
  const t = text(repo);
  return WEB3_FRAMEWORKS.filter(f => t.includes(f));
}

// Calculate repo age in days
function getRepoAgeInDays(repo: RawRepo): number {
  return (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24);
}

// Calculate days since last commit
function getDaysSinceLastCommit(repo: RawRepo): number {
  return (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
}

// Calculate star velocity (stars per day)
function getStarVelocity(repo: RawRepo): number {
  const ageInDays = getRepoAgeInDays(repo);
  return ageInDays > 0 ? repo.stargazers_count / ageInDays : 0;
}

// Detect quality signals
function getQualitySignals(repo: RawRepo): {
  hasReadme: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  hasCI: boolean;
} {
  const t = text(repo);
  
  return {
    hasReadme: repo.description !== null && repo.description.length > 20,
    hasLicense: repo.license !== null,
    hasTests: t.includes("test") || repo.topics?.some(t => t.includes("test")) || false,
    hasCI: repo.topics?.some(t => ["ci", "github-actions", "gitlab-ci"].includes(t)) || false
  };
}

export function evaluateRepo(repo: RawRepo) {
  const t = text(repo);

  // ❌ Hard rejections
  if (repo.owner.type !== "User") return null;
  if (repo.fork) return null;
  if (repo.archived) return null;
  if (JUNK_PATTERNS.some(p => t.includes(p))) return null;
  
  // Calculate metrics
  const repoAgeInDays = getRepoAgeInDays(repo);
  const daysSinceLastCommit = getDaysSinceLastCommit(repo);
  const starVelocity = getStarVelocity(repo);
  
  // ❌ Reject repos inactive for 120+ days
  if (daysSinceLastCommit > 120) return null;
  
  // Detect technologies
  const blockchains = detectBlockchain(repo);
  const language = detectLanguage(repo);
  const frameworks = detectFramework(repo);
  
  // Quality signals
  const quality = getQualitySignals(repo);
  
  // Detect categories
  const categories: string[] = [];
  
  // Blockchain specific
  for (const [category, keywords] of Object.entries(CRYPTO_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) {
      categories.push(category);
    }
  }
  
  // General categories
  if (AI_KEYWORDS.some(k => t.includes(k))) categories.push("ai");
  if (GAMES_KEYWORDS.some(k => t.includes(k))) categories.push("games");
  if (INFRA_KEYWORDS.some(k => t.includes(k))) categories.push("infra");
  
  // Add blockchain as category if detected
  if (blockchains.length > 0 && !categories.includes("crypto")) {
    categories.push("crypto");
  }

  // Scoring
  let score = 0;
  
  // Product indicators
  if (PRODUCT_KEYWORDS.some(k => t.includes(k))) score += 30;
  
  // Category bonuses
  if (categories.length > 0) score += categories.length * 10;
  
  // Community validation
  if (repo.stargazers_count >= 1) score += 10;
  if (repo.stargazers_count >= 10) score += 10;
  if (repo.stargazers_count >= 50) score += 10;
  if (repo.forks_count > 0) score += 10;
  
  // Recent activity
  if (daysSinceLastCommit < 7) score += 20;
  else if (daysSinceLastCommit < 30) score += 15;
  else if (daysSinceLastCommit < 90) score += 10;
  
  // Quality bonuses
  if (quality.hasReadme) score += 5;
  if (quality.hasLicense) score += 5;
  if (quality.hasTests) score += 10;
  if (quality.hasCI) score += 10;
  
  // Early stage bonus
  if (repoAgeInDays < 90 && repo.stargazers_count >= 5) score += 15;
  
  // Star velocity bonus (trending)
  if (starVelocity > 1) score += 10;
  if (starVelocity > 5) score += 10;
  
  // Underrated signal (high quality, low stars)
  const isUnderrated = score >= 60 && repo.stargazers_count < 100 && quality.hasTests;
  if (isUnderrated) score += 15;

  // Coin-worthy determination
  const coinWorthy =
    score >= 70 &&
    categories.length > 0 &&
    repo.stargazers_count >= 5 &&
    quality.hasReadme;

  // Only accept if score is high enough
  if (score < 50) return null;

  return {
    score,
    categories,
    coinWorthy,
    quality,
    // New metrics
    blockchain: blockchains,
    language,
    frameworks,
    repoAgeInDays: Math.round(repoAgeInDays),
    daysSinceLastCommit: Math.round(daysSinceLastCommit),
    starVelocity: parseFloat(starVelocity.toFixed(2)),
    isUnderrated,
    isEarlyStage: repoAgeInDays < 90,
    isActive: daysSinceLastCommit < 30,
    isHot: daysSinceLastCommit < 7
  };
}

export function evaluateBuilder(profile: any, qualityRepoIds: number[]): { accepted: boolean; score: number } {
  // Minimum 2 quality repos
  if (qualityRepoIds.length < 2) {
    return { accepted: false, score: 0 };
  }

  // Calculate builder score (average of top repos)
  const score = Math.round(qualityRepoIds.length * 15);

  return {
    accepted: true,
    score: Math.min(100, score)
  };
}