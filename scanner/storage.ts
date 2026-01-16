import fs from "fs";
import path from "path";
import { DataStore, BuilderRecord, RepoRecord } from "./types";

const DATA_PATH = path.join(process.cwd(), "scanner", "data.json");

export function loadStore(): DataStore {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      builders: {},
      repos: {},
      last_updated: new Date().toISOString()
    };
  }

  const raw = fs.readFileSync(DATA_PATH, "utf8").trim();

  if (!raw) {
    return {
      builders: {},
      repos: {},
      last_updated: new Date().toISOString()
    };
  }

  try {
    const data = JSON.parse(raw) as DataStore;
    // Ensure last_updated exists
    if (!data.last_updated) {
      data.last_updated = new Date().toISOString();
    }
    return data;
  } catch {
    console.warn("⚠️ Corrupted data.json, resetting store");
    return {
      builders: {},
      repos: {},
      last_updated: new Date().toISOString()
    };
  }
}

export function saveStore(store: DataStore) {
  store.last_updated = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
}

// Helper functions
export function getTopBuilders(store: DataStore, limit: number = 100): BuilderRecord[] {
  return Object.values(store.builders)
    .sort((a, b) => b.reputation_score - a.reputation_score)
    .slice(0, limit);
}

export function getCoinWorthyRepos(store: DataStore): RepoRecord[] {
  return Object.values(store.repos)
    .filter(r => r.coin_worthy)
    .sort((a, b) => b.final_score - a.final_score);
}

export function getBuildersByCategory(store: DataStore, category: string): BuilderRecord[] {
  return Object.values(store.builders)
    .filter(builder => {
      // Check if builder has any repos in this category
      const hasCategory = builder.quality_repos.some(repoId => {
        const repo = store.repos[repoId];
        return repo && repo.categories.includes(category);
      });
      return hasCategory;
    })
    .sort((a, b) => b.reputation_score - a.reputation_score);
}

export function getReposByBlockchain(store: DataStore, blockchain: string): RepoRecord[] {
  return Object.values(store.repos)
    .filter(r => r.blockchain && r.blockchain.includes(blockchain))
    .sort((a, b) => b.final_score - a.final_score);
}

export function getHotRepos(store: DataStore): RepoRecord[] {
  return Object.values(store.repos)
    .filter(r => r.isHot)
    .sort((a, b) => b.final_score - a.final_score);
}

export function getUnderratedRepos(store: DataStore): RepoRecord[] {
  return Object.values(store.repos)
    .filter(r => r.isUnderrated)
    .sort((a, b) => b.final_score - a.final_score);
}

export function getEarlyStageRepos(store: DataStore): RepoRecord[] {
  return Object.values(store.repos)
    .filter(r => r.isEarlyStage)
    .sort((a, b) => b.final_score - a.final_score);
}