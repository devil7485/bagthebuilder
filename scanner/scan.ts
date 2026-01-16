import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadStore, saveStore } from "./storage";
import { evaluateRepo } from "./evaluate";
import { RawRepo } from "./types";

dotenv.config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN missing");

const USERS_PER_PAGE = 10;
const REPOS_PER_USER = 25;

// 🎯 BUILDER TARGET RANGE
const MIN_FOLLOWERS = 20;
const MAX_FOLLOWERS = 800;
const MAX_REPO_STARS = 5000;

async function fetchUsers(): Promise<any[]> {
  const res = await fetch(
    `https://api.github.com/search/users?q=type:user+followers:>${MIN_FOLLOWERS}&per_page=${USERS_PER_PAGE}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.items || [];
}

async function fetchUserProfile(username: string): Promise<any> {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) return null;
  return await res.json();
}

async function fetchUserRepos(username: string): Promise<RawRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=${REPOS_PER_USER}&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!res.ok) return [];
  return await res.json();
}

async function runScan() {
  const store = loadStore();

  console.log("🔍 Scanning underrated builders…");

  const users = await fetchUsers();
  console.log("👥 Candidates:", users.length);

  for (const user of users) {
    const profile = await fetchUserProfile(user.login);
    if (!profile) continue;

    // ❌ Skip famous or tiny accounts
    if (
      profile.followers < MIN_FOLLOWERS ||
      profile.followers > MAX_FOLLOWERS
    ) {
      continue;
    }

    const repos = await fetchUserRepos(user.login);

    for (const repo of repos) {
      if (store.repos[repo.id]) continue;
      if (repo.stargazers_count > MAX_REPO_STARS) continue;

      const evalResult = evaluateRepo(repo);
      if (!evalResult) continue;

      console.log("✅ Accepted:", repo.full_name);

      store.repos[repo.id] = {
        id: repo.id,
        builder: repo.owner.login,
        name: repo.name,
        description: repo.description!,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        last_commit_at: repo.pushed_at,
        categories: evalResult.categories,
        product_score: evalResult.score,
        coin_worthy: evalResult.coinWorthy
      };

      const existing = store.builders[repo.owner.login];

      if (!existing) {
        store.builders[repo.owner.login] = {
          id: repo.owner.id,
          username: repo.owner.login,
          avatar: repo.owner.avatar_url,
          profile_url: repo.owner.html_url,
          repos: [repo.id],
          reputation_score: evalResult.score,
          first_seen_at: new Date().toISOString(),
          last_active_at: repo.pushed_at
        };
      } else {
        existing.repos.push(repo.id);
        existing.reputation_score += evalResult.score;
        existing.last_active_at = repo.pushed_at;
      }
    }
  }

  saveStore(store);
  console.log("🚀 Scan complete");
}

runScan().catch((err) => {
  console.error("❌ Scan failed:", err);
});
