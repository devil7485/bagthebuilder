import dotenv from "dotenv";
import { loadStore, saveStore } from "./storage";
import { evaluateRepo, evaluateBuilder } from "./evaluate";
import { RawRepo, RawUser } from "./types";
import { execSync } from "child_process";

dotenv.config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN missing");

const USERS_PER_BATCH = 30;
const REPOS_PER_USER = 30;
const MIN_FOLLOWERS = 20;
const MAX_FOLLOWERS = 2000;
const MAX_REPO_STARS = 5000;

let rateLimitRemaining = 5000;
let rateLimitReset = Date.now() + (1000 * 60 * 60);

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

async function checkRateLimit() {
  if (rateLimitRemaining < 100) {
    const waitTime = rateLimitReset - Date.now();
    if (waitTime > 0) {
      console.log(`⏳ Rate limit low (${rateLimitRemaining}), waiting ${Math.round(waitTime / 60000)} minutes...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      rateLimitRemaining = 5000;
    }
  }
}

async function getTrendingRepos(): Promise<RawRepo[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const query = `stars:50..${MAX_REPO_STARS} pushed:>${since}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=100`;
  
  const res = await fetchWithRateLimit(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  return data.items || [];
}

async function searchUsersByTopic(topic: string): Promise<any[]> {
  const query = `type:user followers:${MIN_FOLLOWERS}..${MAX_FOLLOWERS} repos:>5`;
  const url = `https://api.github.com/search/users?q=${encodeURIComponent(query + ` ${topic}`)}&per_page=100`;
  
  const res = await fetchWithRateLimit(url);
  if (!res.ok) return [];
  
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
    `https://api.github.com/users/${username}/repos?per_page=${REPOS_PER_USER}&sort=updated&type=owner`
  );
  if (!res.ok) return [];
  return await res.json();
}

async function processUser(username: string, store: any): Promise<boolean> {
  const existingBuilder = store.builders[username];
  if (existingBuilder) {
    const hoursSinceLastScan = (Date.now() - new Date(existingBuilder.last_scanned_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastScan < 24) {
      console.log(`  ⏭️  ${username} - Scanned ${Math.round(hoursSinceLastScan)}h ago, skipping`);
      return false;
    }
  }

  const profile = await fetchUserProfile(username);
  if (!profile) return false;

  if (profile.followers < MIN_FOLLOWERS || profile.followers > MAX_FOLLOWERS) return false;

  const repos = await fetchUserRepos(username);
  const qualityRepoIds: number[] = [];
  let totalScore = 0;

  for (const repo of repos) {
    // Skip already stored repos
    if (store.repos[repo.id]) {
      qualityRepoIds.push(repo.id);
      continue;
    }

    if (repo.stargazers_count > MAX_REPO_STARS) continue;

    const evalResult = evaluateRepo(repo);
    if (!evalResult) continue;

    // 🎯 SAVE ALL THE NEW FIELDS FROM EVALUATE RESULT
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
      
      // Original fields
      categories: evalResult.categories,
      quality: evalResult.quality,
      product_score: Math.round(evalResult.score * 0.6),
      execution_score: Math.round(evalResult.score * 0.4),
      final_score: evalResult.score,
      coin_worthy: evalResult.coinWorthy,
      
      // 🔥 NEW FIELDS FROM ENHANCED EVALUATE
      blockchain: evalResult.blockchain || [],
      frameworks: evalResult.frameworks || [],
      repoAgeInDays: evalResult.repoAgeInDays,
      daysSinceLastCommit: evalResult.daysSinceLastCommit,
      starVelocity: evalResult.starVelocity,
      isUnderrated: evalResult.isUnderrated || false,
      isEarlyStage: evalResult.isEarlyStage || false,
      isActive: evalResult.isActive || false,
      isHot: evalResult.isHot || false,
      
      // Activity tracking
      activity: {
        total_commits: 0,
        weeks_active: 0,
        avg_commits_per_week: 0,
        last_commit_date: repo.pushed_at,
        consistency_score: 50
      }
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

  // Enhanced console output
  const badges = [];
  const hasHotRepo = qualityRepoIds.some(id => store.repos[id]?.isHot);
  const hasUnderratedRepo = qualityRepoIds.some(id => store.repos[id]?.isUnderrated);
  const hasEarlyStageRepo = qualityRepoIds.some(id => store.repos[id]?.isEarlyStage);
  
  if (hasHotRepo) badges.push("🔥");
  if (hasUnderratedRepo) badges.push("💎");
  if (hasEarlyStageRepo) badges.push("🚀");
  
  const blockchains = [...new Set(qualityRepoIds.map(id => store.repos[id]?.blockchain || []).flat())];
  
  console.log(`  ✅ ${username} ${badges.join(" ")} | Score: ${builderEval.score} | Repos: ${qualityRepoIds.length} | ${focusAreas.join(", ")}${blockchains.length > 0 ? ` | ${blockchains.join(", ")}` : ""}`);
  return true;
}

async function runScan() {
  const store = loadStore();

  console.log("🚀 Starting optimized scan...\n");
  console.log("═".repeat(70));

  let newBuildersFound = 0;
  let processedUsers = 0;
  let skippedUsers = 0;
  let skippedRepos = 0;

  // Strategy 1: Trending repos
  console.log("\n📈 Strategy 1: Scanning trending repositories...");
  const trendingRepos = await getTrendingRepos();
  console.log(`Found ${trendingRepos.length} trending repos`);

  const trendingBuilders = [...new Set(trendingRepos.map(r => r.owner.login))];
  console.log(`Extracted ${trendingBuilders.length} unique builders\n`);

  for (const username of trendingBuilders.slice(0, USERS_PER_BATCH)) {
    await checkRateLimit();
    
    console.log(`\n🔍 Scanning: ${username}`);
    const success = await processUser(username, store);
    if (success) {
      newBuildersFound++;
    } else {
      // Check if it was skipped vs rejected
      if (store.builders[username]) {
        skippedUsers++;
      }
    }
    processedUsers++;
    
    if (processedUsers % 5 === 0) {
      saveStore(store);
      console.log(`\n💾 Progress saved (${processedUsers} users processed, ${newBuildersFound} builders found)\n`);
    }
  }

  // Strategy 2: Topic search
  if (newBuildersFound < 10) {
    console.log("\n\n🎯 Strategy 2: Topic-based search...");
    const topics = ["crypto", "ai", "web3", "llm"];
    
    for (const topic of topics) {
      console.log(`\nSearching topic: ${topic}`);
      const users = await searchUsersByTopic(topic);
      console.log(`Found ${users.length} users\n`);
      
      for (const user of users.slice(0, 10)) {
        await checkRateLimit();
        
        console.log(`🔍 Scanning: ${user.login}`);
        const success = await processUser(user.login, store);
        if (success) newBuildersFound++;
        processedUsers++;
      }
    }
  }

  saveStore(store);

  console.log("\n" + "═".repeat(70));
  console.log("🎉 Scan complete!");
  console.log(`📊 Stats:`);
  console.log(`   - Users processed: ${processedUsers}`);
  console.log(`   - New builders found: ${newBuildersFound}`);
  console.log(`   - Users skipped (scanned <24h ago): ${skippedUsers}`);
  console.log(`   - Total builders in DB: ${Object.keys(store.builders).length}`);
  console.log(`   - Total repos in DB: ${Object.keys(store.repos).length}`);
  
  // Show breakdown of new metrics
  const allRepos = Object.values(store.repos) as any[];
  const hotRepos = allRepos.filter(r => r.isHot).length;
  const underratedRepos = allRepos.filter(r => r.isUnderrated).length;
  const earlyStageRepos = allRepos.filter(r => r.isEarlyStage).length;
  const withTests = allRepos.filter(r => r.quality?.hasTests).length;
  const blockchainRepos = allRepos.filter(r => r.blockchain?.length > 0).length;
  
  console.log(`\n🔥 Breakdown:`);
  console.log(`   - Hot repos (< 7d): ${hotRepos}`);
  console.log(`   - Hidden gems: ${underratedRepos}`);
  console.log(`   - Early stage: ${earlyStageRepos}`);
  console.log(`   - With tests: ${withTests}`);
  console.log(`   - Blockchain tagged: ${blockchainRepos}`);
  console.log("═".repeat(70));

  // 🎯 AUTO-EXPORT AFTER SCAN
  console.log("\n🔄 Running auto-export...\n");
  try {
    execSync("npx tsx scanner/auto-export.ts", { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Auto-export failed:", error);
  }
}

runScan().catch((err) => {
  console.error("\n❌ Scan failed:", err);
  process.exit(1);
});