import dotenv from "dotenv";
import { loadStore, saveStore } from "./storage";
import { evaluateRepo, evaluateBuilder } from "./evaluate";
import { RawRepo, RawUser } from "./types";

dotenv.config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN missing");

// 🎯 OPTIMIZED SCANNING PARAMETERS
const SCAN_BATCH_SIZE = 15;           
const MIN_RATE_LIMIT_BUFFER = 100;    // Need buffer for search queries
const SCAN_DELAY_MS = 2000;           
const MAX_USERS_PER_HOUR = 100;       

// Scanning ranges
const MIN_FOLLOWERS = 20;
const MAX_FOLLOWERS = 2000;
const MAX_REPO_STARS = 5000;

// Global rate limit tracking
let rateLimitRemaining = 5000;
let rateLimitReset = Date.now() + (1000 * 60 * 60);
let totalScannedThisHour = 0;
let hourStartTime = Date.now();

async function fetchWithRateLimit(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      ...options.headers
    }
  });

  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  
  if (remaining) rateLimitRemaining = parseInt(remaining);
  if (reset) rateLimitReset = parseInt(reset) * 1000;

  return res;
}

async function checkAndWaitForRateLimit(): Promise<boolean> {
  // Check hourly limit
  const hourElapsed = Date.now() - hourStartTime;
  if (hourElapsed > 3600000) {
    totalScannedThisHour = 0;
    hourStartTime = Date.now();
  }

  if (totalScannedThisHour >= MAX_USERS_PER_HOUR) {
    const waitTime = 3600000 - hourElapsed;
    console.log(`\n⏸️  Reached hourly limit (${MAX_USERS_PER_HOUR} users). Waiting ${Math.round(waitTime / 60000)} minutes...\n`);
    await sleep(waitTime);
    totalScannedThisHour = 0;
    hourStartTime = Date.now();
    return true;
  }

  // Check if we need to wait for rate limit
  if (rateLimitRemaining < MIN_RATE_LIMIT_BUFFER) {
    const waitTime = rateLimitReset - Date.now();
    if (waitTime > 0) {
      console.log(`\n⏸️  Rate limit low (${rateLimitRemaining}/${MIN_RATE_LIMIT_BUFFER}). Pausing for ${Math.round(waitTime / 60000)} minutes...\n`);
      await sleep(waitTime + 5000);
      
      // Refresh rate limit after wait
      await getRateLimitStatus();
      return true;
    }
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRateLimitStatus(): Promise<{ remaining: number; reset: number; limit: number }> {
  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });
    
    const data = await res.json();
    rateLimitRemaining = data.resources.core.remaining;
    rateLimitReset = data.resources.core.reset * 1000;
    
    return {
      remaining: rateLimitRemaining,
      reset: rateLimitReset,
      limit: data.resources.core.limit
    };
  } catch (error) {
    return { remaining: rateLimitRemaining, reset: rateLimitReset, limit: 5000 };
  }
}

async function getTrendingRepos(page: number = 1): Promise<RawRepo[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const query = `stars:50..${MAX_REPO_STARS} pushed:>${since}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=30&page=${page}`;
  
  const res = await fetchWithRateLimit(url);
  
  if (!res.ok) {
    console.error(`⚠️  Trending search failed: ${res.status}`);
    return [];
  }
  
  const data = await res.json();
  return data.items || [];
}

async function searchUsersByTopic(topic: string, page: number = 1): Promise<any[]> {
  const query = `type:user followers:${MIN_FOLLOWERS}..${MAX_FOLLOWERS} repos:>3 ${topic}`;
  const url = `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=30&page=${page}`;
  
  const res = await fetchWithRateLimit(url);
  
  if (!res.ok) {
    console.error(`⚠️  User search failed: ${res.status}`);
    return [];
  }
  
  const data = await res.json();
  return data.items || [];
}

async function fetchUserProfile(username: string): Promise<RawUser | null> {
  const res = await fetchWithRateLimit(`https://api.github.com/users/${username}`);
  if (!res.ok) return null;
  return await res.json();
}

async function fetchUserRepos(username: string): Promise<RawRepo[]> {
  const res = await fetchWithRateLimit(
    `https://api.github.com/users/${username}/repos?per_page=30&sort=updated&type=owner`
  );
  if (!res.ok) return [];
  return await res.json();
}

async function processUser(username: string, store: any): Promise<boolean> {
  const existingBuilder = store.builders[username];
  if (existingBuilder) {
    const hoursSinceLastScan = (Date.now() - new Date(existingBuilder.last_scanned_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastScan < 24) {
      return false;
    }
  }

  const profile = await fetchUserProfile(username);
  if (!profile) return false;

  if (profile.followers < MIN_FOLLOWERS || profile.followers > MAX_FOLLOWERS) {
    return false;
  }

  const repos = await fetchUserRepos(username);
  
  const qualityRepoIds: number[] = [];
  let totalScore = 0;

  for (const repo of repos) {
    if (store.repos[repo.id]) {
      qualityRepoIds.push(repo.id);
      continue;
    }

    if (repo.stargazers_count > MAX_REPO_STARS) continue;

    const evalResult = evaluateRepo(repo);
    if (!evalResult) continue;

    store.repos[repo.id] = {
      id: repo.id,
      builder: username,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || "",
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      open_issues: repo.open_issues_count,
      language: repo.language,
      topics: repo.topics || [],
      created_at: repo.created_at,
      last_commit_at: repo.pushed_at,
      categories: evalResult.categories,
      quality: evalResult.quality,
      activity: {
        total_commits: 0,
        weeks_active: 0,
        avg_commits_per_week: 0,
        last_commit_date: repo.pushed_at,
        consistency_score: 50
      },
      product_score: Math.round(evalResult.score * 0.6),
      execution_score: Math.round(evalResult.score * 0.4),
      final_score: evalResult.score,
      coin_worthy: evalResult.coinWorthy
    };

    qualityRepoIds.push(repo.id);
    totalScore += evalResult.score;
  }

  const builderEval = evaluateBuilder(profile, qualityRepoIds);
  if (!builderEval.accepted) return false;

  const focusAreas = [...new Set(
    qualityRepoIds.map(id => store.repos[id]?.categories || []).flat()
  )];

  store.builders[username] = {
    id: profile.id,
    username: profile.login,
    name: profile.name,
    avatar: profile.avatar_url,
    profile_url: profile.html_url,
    bio: profile.bio,
    location: profile.location,
    website: profile.blog,
    twitter: profile.twitter_username,
    total_repos: profile.public_repos,
    quality_repos: qualityRepoIds,
    focus_areas: focusAreas,
    followers: profile.followers,
    public_repos: profile.public_repos,
    reputation_score: builderEval.score,
    consistency_score: Math.round(totalScore / qualityRepoIds.length) || 0,
    first_seen_at: existingBuilder?.first_seen_at || new Date().toISOString(),
    last_active_at: repos[0]?.pushed_at || new Date().toISOString(),
    last_scanned_at: new Date().toISOString()
  };

  console.log(`  ✅ ${username} | Score: ${builderEval.score} | Repos: ${qualityRepoIds.length} | ${focusAreas.join(", ")}`);
  return true;
}

async function runContinuousScan() {
  console.log("🔄 CONTINUOUS SCANNER STARTED");
  console.log("═".repeat(70));

  const store = loadStore();
  let cycleCount = 0;
  let totalBuildersFound = 0;

  const strategies = [
    { name: "Trending Repos", fn: async () => await getTrendingRepos(Math.floor(Math.random() * 3) + 1) },
    { name: "Crypto", fn: async () => await searchUsersByTopic("crypto", Math.floor(Math.random() * 3) + 1) },
    { name: "AI", fn: async () => await searchUsersByTopic("ai", Math.floor(Math.random() * 3) + 1) },
    { name: "Web3", fn: async () => await searchUsersByTopic("web3", Math.floor(Math.random() * 3) + 1) }
  ];

  while (true) {
    cycleCount++;
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🔄 CYCLE #${cycleCount} | Builders: ${Object.keys(store.builders).length} | Session: +${totalBuildersFound}`);
    console.log(`${"=".repeat(70)}`);

    // CRITICAL: Check rate limit BEFORE doing expensive search
    const needsWait = await checkAndWaitForRateLimit();
    if (needsWait) {
      // After waiting, refresh rate limit
      await getRateLimitStatus();
    }

    const rateStatus = await getRateLimitStatus();
    const resetIn = Math.round((rateStatus.reset - Date.now()) / 60000);
    console.log(`📊 Rate: ${rateStatus.remaining}/${rateStatus.limit} (resets ${resetIn}min) | Hour: ${totalScannedThisHour}/${MAX_USERS_PER_HOUR}`);

    const strategy = strategies[cycleCount % strategies.length];
    console.log(`🎯 ${strategy.name}`);

    try {
      let candidates: any[] = [];

      if (strategy.name === "Trending Repos") {
        const repos = await strategy.fn();
        candidates = [...new Set(repos.map((r: any) => r.owner.login))];
      } else {
        candidates = await strategy.fn();
        candidates = candidates.map((u: any) => u.login);
      }

      console.log(`   ${candidates.length} candidates\n`);

      let processed = 0;
      let found = 0;

      for (const username of candidates.slice(0, SCAN_BATCH_SIZE)) {
        // Check before each user
        if (rateLimitRemaining < MIN_RATE_LIMIT_BUFFER) {
          console.log(`\n⚠️  Rate limit low, stopping batch\n`);
          break;
        }

        const success = await processUser(username, store);
        if (success) {
          found++;
          totalBuildersFound++;
        }
        
        processed++;
        totalScannedThisHour++;

        await sleep(SCAN_DELAY_MS);

        if (processed % 5 === 0) saveStore(store);
      }

      saveStore(store);
      console.log(`\n✨ Batch: ${found}/${processed} builders | Rate: ${rateLimitRemaining} remaining`);

    } catch (error) {
      console.error(`\n❌ Error:`, error);
      await sleep(30000);
    }

    await sleep(5000);
  }
}

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  process.exit(0);
});

runContinuousScan().catch((err) => {
  console.error("\n❌ Crashed:", err);
  process.exit(1);
});