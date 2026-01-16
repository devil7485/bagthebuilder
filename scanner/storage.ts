import fs from "fs";
import path from "path";
import { BuilderRecord, RepoRecord, Store, ScanState } from "./types";

const DATA_PATH = path.join(process.cwd(), "scanner", "data.json");
const STATE_PATH = path.join(process.cwd(), "scanner", "state.json");

/**
 * Load store with builders and repos
 */
export function loadStore(): Store {
  let builders: Record<string, BuilderRecord> = {};
  let repos: Record<string, RepoRecord> = {};
  let state: ScanState = createDefaultState();

  // Load main data
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, "utf8").trim();
      if (raw) {
        const data = JSON.parse(raw);
        builders = data.builders || {};
        repos = data.repos || {};
      }
    } catch (error) {
      console.warn("⚠️  Corrupted data.json, starting fresh");
      backupCorruptedFile(DATA_PATH);
    }
  }

  // Load state
  if (fs.existsSync(STATE_PATH)) {
    try {
      const raw = fs.readFileSync(STATE_PATH, "utf8").trim();
      if (raw) {
        const stateData = JSON.parse(raw);
        state = {
          ...stateData,
          scanned_users: new Set(stateData.scanned_users || [])
        };
      }
    } catch (error) {
      console.warn("⚠️  Corrupted state.json, resetting state");
      backupCorruptedFile(STATE_PATH);
    }
  }

  return { builders, repos, state };
}

/**
 * Save store to disk
 */
export function saveStore(store: Store) {
  try {
    // Save main data
    const dataToSave = {
      builders: store.builders,
      repos: store.repos
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(dataToSave, null, 2));

    // Save state
    const stateToSave = {
      ...store.state,
      scanned_users: Array.from(store.state.scanned_users)
    };
    fs.writeFileSync(STATE_PATH, JSON.stringify(stateToSave, null, 2));

    console.log("💾 Store saved successfully");
  } catch (error) {
    console.error("❌ Failed to save store:", error);
    throw error;
  }
}

/**
 * Create default state
 */
function createDefaultState(): ScanState {
  return {
    last_scanned_at: new Date().toISOString(),
    total_builders_found: 0,
    total_repos_evaluated: 0,
    scanned_users: new Set<string>(),
    rate_limit: {
      remaining: 5000,
      reset_at: Date.now() + (1000 * 60 * 60)
    }
  };
}

/**
 * Backup corrupted file
 */
function backupCorruptedFile(filepath: string) {
  try {
    const backupPath = `${filepath}.backup.${Date.now()}`;
    fs.copyFileSync(filepath, backupPath);
    console.log(`📦 Corrupted file backed up to: ${backupPath}`);
  } catch (error) {
    console.error("Failed to backup corrupted file:", error);
  }
}

/**
 * Get top builders by score
 */
export function getTopBuilders(store: Store, limit: number = 50): BuilderRecord[] {
  return Object.values(store.builders)
    .sort((a, b) => b.reputation_score - a.reputation_score)
    .slice(0, limit);
}

/**
 * Get builders by category
 */
export function getBuildersByCategory(store: Store, category: string): BuilderRecord[] {
  return Object.values(store.builders)
    .filter(builder => builder.focus_areas.includes(category))
    .sort((a, b) => b.reputation_score - a.reputation_score);
}

/**
 * Get coin-worthy repos
 */
export function getCoinWorthyRepos(store: Store): RepoRecord[] {
  return Object.values(store.repos)
    .filter(repo => repo.coin_worthy)
    .sort((a, b) => b.final_score - a.final_score);
}

/**
 * Get builder with their repos
 */
export function getBuilderWithRepos(store: Store, username: string): {
  builder: BuilderRecord | null;
  repos: RepoRecord[];
} {
  const builder = store.builders[username];
  if (!builder) {
    return { builder: null, repos: [] };
  }

  const repos = builder.quality_repos
    .map(id => store.repos[id])
    .filter(Boolean);

  return { builder, repos };
}

/**
 * Get stats
 */
export function getStats(store: Store) {
  const totalBuilders = Object.keys(store.builders).length;
  const totalRepos = Object.keys(store.repos).length;
  const coinWorthyRepos = Object.values(store.repos).filter(r => r.coin_worthy).length;
  
  const categories = Object.values(store.builders)
    .flatMap(b => b.focus_areas)
    .reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const avgReposPerBuilder = totalBuilders > 0 
    ? (Object.values(store.builders).reduce((sum, b) => sum + b.quality_repos.length, 0) / totalBuilders).toFixed(1)
    : 0;

  return {
    totalBuilders,
    totalRepos,
    coinWorthyRepos,
    avgReposPerBuilder,
    categories,
    lastScanned: store.state.last_scanned_at
  };
}