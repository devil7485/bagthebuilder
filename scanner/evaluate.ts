import { RawRepo, RawUser, EvaluationResult, RepoQuality, CommitActivity, CategoryKeywords } from "./types";

// 🎯 COMPREHENSIVE CATEGORY KEYWORDS
const CATEGORY_KEYWORDS: CategoryKeywords = {
  crypto: [
    "crypto", "web3", "blockchain", "defi", "wallet", "dao", "token",
    "zk", "zero-knowledge", "ethereum", "solana", "bitcoin", "nft",
    "dex", "smart-contract", "evm", "layer2", "rollup", "bridge"
  ],
  ai: [
    "ai", "ml", "machine-learning", "llm", "gpt", "transformer",
    "neural", "deep-learning", "nlp", "computer-vision", "model",
    "inference", "training", "pytorch", "tensorflow", "langchain"
  ],
  infra: [
    "kubernetes", "docker", "devops", "cloud", "infrastructure",
    "monitoring", "observability", "cicd", "deployment", "terraform",
    "ansible", "helm", "container", "orchestration", "serverless"
  ],
  privacy: [
    "privacy", "encryption", "security", "e2e", "end-to-end",
    "vpn", "proxy", "anonymous", "confidential", "secure-messaging",
    "pgp", "tor", "i2p", "cryptography"
  ],
  games: [
    "game", "gaming", "gamedev", "unity", "unreal", "godot",
    "game-engine", "phaser", "three.js", "webgl", "multiplayer",
    "mmo", "fps", "rpg", "simulation"
  ],
  api: [
    "api", "rest", "graphql", "sdk", "client", "wrapper",
    "integration", "webhook", "endpoint", "microservice", "grpc",
    "openapi", "swagger"
  ],
  agi: [
    "agi", "artificial-general-intelligence", "autonomous-agent",
    "reasoning", "planning", "multi-agent", "cognitive", "sapient"
  ],
  tools: [
    "cli", "tool", "utility", "automation", "productivity",
    "developer-tools", "devtools", "extension", "plugin"
  ]
};

// ❌ HARD REJECTION KEYWORDS
const REJECTION_KEYWORDS = [
  "awesome-", "cheatsheet", "roadmap", "course", "tutorial-series",
  "learning-path", "interview-prep", "practice-problems", "homework",
  "assignment", "notes", "book", "guide", "collection", "curated-list",
  "resources", "links", "reference"
];

// 🚫 IMMEDIATE DISQUALIFIERS
const JUNK_PATTERNS = {
  learningRepos: ["learn", "tutorial", "example", "sample", "demo", "practice"],
  personalRepos: ["my-", "personal-", "dotfiles", "config"],
  forkIndicators: ["fork", "clone", "copy"],
  incompleteWork: ["wip", "work-in-progress", "todo", "draft"]
};

// 🎯 PRODUCT INDICATORS (Strong signals of real projects)
const PRODUCT_INDICATORS = [
  "app", "platform", "tool", "service", "sdk", "engine", "framework",
  "library", "cli", "api", "dashboard", "server", "client", "protocol",
  "network", "system", "infrastructure", "bot", "automation"
];

/**
 * Get combined text for keyword matching
 */
function getSearchableText(repo: RawRepo): string {
  const parts = [
    repo.name,
    repo.description || "",
    ...(repo.topics || [])
  ];
  return parts.join(" ").toLowerCase();
}

/**
 * Check if repo is obvious junk (fast rejections)
 */
function isObviousJunk(repo: RawRepo): { isJunk: boolean; reason?: string } {
  // Must be from individual user
  if (repo.owner.type !== "User") {
    return { isJunk: true, reason: "Not from individual user" };
  }

  // Reject forks
  if (repo.fork) {
    return { isJunk: true, reason: "Is a fork" };
  }

  // Reject archived
  if (repo.archived) {
    return { isJunk: true, reason: "Archived repository" };
  }

  const text = getSearchableText(repo);

  // Reject learning/tutorial repos
  if (REJECTION_KEYWORDS.some(keyword => text.includes(keyword))) {
    return { isJunk: true, reason: "Learning/tutorial repository" };
  }

  // Reject repos with too few commits (likely inactive)
  const daysSinceLastCommit = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastCommit > 365) {
    return { isJunk: true, reason: "Inactive for over 1 year" };
  }

  // Reject tiny repos (likely incomplete)
  if (repo.size < 10) {
    return { isJunk: true, reason: "Repository too small" };
  }

  // Reject repos with no activity
  const repoAge = (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (repoAge > 30 && repo.stargazers_count === 0 && repo.forks_count === 0) {
    return { isJunk: true, reason: "No community validation" };
  }

  return { isJunk: false };
}

/**
 * Detect categories from repo content
 */
function detectCategories(repo: RawRepo): string[] {
  const text = getSearchableText(repo);
  const categories: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * Evaluate repository quality
 */
function evaluateQuality(repo: RawRepo): RepoQuality {
  const text = getSearchableText(repo);
  
  // Basic quality indicators
  const hasReadme = repo.size > 10; // Proxy check
  const hasLicense = repo.license !== null;
  const hasTests = text.includes("test") || text.includes("spec");
  const hasCI = repo.topics?.some(t => ["ci", "github-actions", "travis", "circleci"].includes(t)) || false;

  // Documentation quality (0-100)
  let docQuality = 0;
  if (hasReadme) docQuality += 30;
  if (repo.description && repo.description.length > 20) docQuality += 20;
  if (repo.has_wiki) docQuality += 15;
  if (repo.topics && repo.topics.length > 0) docQuality += 15;
  if (hasLicense) docQuality += 10;
  if (repo.description && repo.description.length > 100) docQuality += 10;

  // Code quality score (0-100)
  let codeQuality = 0;
  if (repo.language) codeQuality += 20;
  if (hasTests) codeQuality += 25;
  if (hasCI) codeQuality += 25;
  if (repo.stargazers_count > 10) codeQuality += 15;
  if (repo.forks_count > 5) codeQuality += 15;

  // Maintenance score (0-100)
  const daysSinceUpdate = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  let maintenanceScore = 0;
  if (daysSinceUpdate < 30) maintenanceScore = 100;
  else if (daysSinceUpdate < 90) maintenanceScore = 80;
  else if (daysSinceUpdate < 180) maintenanceScore = 60;
  else if (daysSinceUpdate < 365) maintenanceScore = 40;
  else maintenanceScore = 20;

  return {
    has_readme: hasReadme,
    has_license: hasLicense,
    has_tests: hasTests,
    has_ci: hasCI,
    documentation_quality: Math.min(100, docQuality),
    code_quality_score: Math.min(100, codeQuality),
    maintenance_score: maintenanceScore
  };
}

/**
 * Calculate product score (how much it looks like a real product)
 */
function calculateProductScore(repo: RawRepo, categories: string[]): number {
  const text = getSearchableText(repo);
  let score = 0;

  // Has product indicators
  const productMatches = PRODUCT_INDICATORS.filter(ind => text.includes(ind)).length;
  score += Math.min(30, productMatches * 10);

  // Has meaningful categories
  score += categories.length * 10;

  // Community validation
  if (repo.stargazers_count >= 1) score += 5;
  if (repo.stargazers_count >= 10) score += 10;
  if (repo.stargazers_count >= 50) score += 15;
  if (repo.forks_count > 0) score += 5;
  if (repo.forks_count >= 5) score += 10;

  // Active development
  const daysSinceUpdate = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) score += 20;
  else if (daysSinceUpdate < 90) score += 15;
  else if (daysSinceUpdate < 180) score += 10;

  // Has documentation
  if (repo.description && repo.description.length > 50) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate execution score (how well executed the project is)
 */
function calculateExecutionScore(repo: RawRepo, quality: RepoQuality): number {
  let score = 0;

  // Quality metrics
  score += quality.code_quality_score * 0.4;
  score += quality.documentation_quality * 0.3;
  score += quality.maintenance_score * 0.3;

  return Math.round(Math.min(100, score));
}

/**
 * Main evaluation function
 */
export function evaluateRepo(repo: RawRepo): EvaluationResult | null {
  // Fast rejection check
  const junkCheck = isObviousJunk(repo);
  if (junkCheck.isJunk) {
    return null;
  }

  // Detect categories
  const categories = detectCategories(repo);
  
  // Must match at least one target category
  if (categories.length === 0) {
    return null;
  }

  // Evaluate quality
  const quality = evaluateQuality(repo);

  // Calculate scores
  const productScore = calculateProductScore(repo, categories);
  const executionScore = calculateExecutionScore(repo, quality);
  const finalScore = Math.round((productScore * 0.6) + (executionScore * 0.4));

  // Minimum thresholds for acceptance
  const MIN_FINAL_SCORE = 50;
  const MIN_PRODUCT_SCORE = 40;
  
  if (finalScore < MIN_FINAL_SCORE || productScore < MIN_PRODUCT_SCORE) {
    return null;
  }

  // Coin-worthy criteria (higher bar)
  const coinWorthy = 
    finalScore >= 70 &&
    productScore >= 60 &&
    executionScore >= 50 &&
    categories.length > 0 &&
    repo.stargazers_count >= 5;

  return {
    accepted: true,
    score: finalScore,
    categories,
    quality,
    coinWorthy
  };
}

/**
 * Evaluate builder profile
 */
export function evaluateBuilder(
  user: RawUser,
  qualityRepos: number[]
): { accepted: boolean; reason?: string; score: number } {
  // Minimum quality repos requirement
  if (qualityRepos.length < 2) {
    return { 
      accepted: false, 
      reason: "Less than 2 quality repos",
      score: 0 
    };
  }

  // Check follower range (underrated but validated)
  const MIN_FOLLOWERS = 20;
  const MAX_FOLLOWERS = 2000;
  
  if (user.followers < MIN_FOLLOWERS) {
    return { 
      accepted: false, 
      reason: "Too few followers (not validated)",
      score: 0 
    };
  }

  if (user.followers > MAX_FOLLOWERS) {
    return { 
      accepted: false, 
      reason: "Too many followers (already famous)",
      score: 0 
    };
  }

  // Calculate builder score
  let score = 0;
  
  // Quality repo count (max 50 points)
  score += Math.min(50, qualityRepos.length * 10);
  
  // Follower validation (max 25 points)
  const followerScore = (user.followers / MAX_FOLLOWERS) * 25;
  score += followerScore;
  
  // Has bio/profile info (max 15 points)
  if (user.bio) score += 10;
  if (user.blog) score += 5;
  
  // Public repos (max 10 points)
  score += Math.min(10, (user.public_repos / 20) * 10);

  return {
    accepted: true,
    score: Math.round(Math.min(100, score))
  };
}