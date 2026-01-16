import { loadStore } from "./storage";

function runStats() {
  const store = loadStore();
  
  const builders = Object.values(store.builders);
  const repos = Object.values(store.repos);
  
  console.log("\n📊 BagTheBuilder Statistics\n");
  console.log("═".repeat(70));
  
  // Basic stats
  console.log("\n📈 Overview:");
  console.log(`   Total Builders: ${builders.length}`);
  console.log(`   Total Repos: ${repos.length}`);
  console.log(`   Coin-Worthy Repos: ${repos.filter(r => r.coin_worthy).length}`);
  
  // Activity breakdown
  const hotRepos = repos.filter(r => r.isHot).length;
  const activeRepos = repos.filter(r => r.isActive).length;
  const quietRepos = repos.filter(r => !r.isActive).length;
  
  console.log("\n🔥 Activity:");
  console.log(`   Hot (< 7 days): ${hotRepos}`);
  console.log(`   Active (< 30 days): ${activeRepos}`);
  console.log(`   Quiet (30+ days): ${quietRepos}`);
  
  // Discovery signals
  const underratedRepos = repos.filter(r => r.isUnderrated).length;
  const earlyStageRepos = repos.filter(r => r.isEarlyStage).length;
  
  console.log("\n💎 Discovery:");
  console.log(`   Hidden Gems: ${underratedRepos}`);
  console.log(`   Early Stage (< 90 days): ${earlyStageRepos}`);
  
  // Quality signals
  const withTests = repos.filter(r => r.quality?.hasTests).length;
  const withCI = repos.filter(r => r.quality?.hasCI).length;
  const withLicense = repos.filter(r => r.quality?.hasLicense).length;
  
  console.log("\n✅ Quality:");
  console.log(`   Has Tests: ${withTests}`);
  console.log(`   Has CI/CD: ${withCI}`);
  console.log(`   Has License: ${withLicense}`);
  
  // Blockchain breakdown
  const blockchainCounts: Record<string, number> = {};
  repos.forEach(r => {
    if (r.blockchain && Array.isArray(r.blockchain)) {
      r.blockchain.forEach(chain => {
        blockchainCounts[chain] = (blockchainCounts[chain] || 0) + 1;
      });
    }
  });
  
  if (Object.keys(blockchainCounts).length > 0) {
    console.log("\n⛓️  Blockchains:");
    Object.entries(blockchainCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([chain, count]) => {
        console.log(`   ${chain}: ${count}`);
      });
  }
  
  // Language breakdown
  const languageCounts: Record<string, number> = {};
  repos.forEach(r => {
    if (r.language) {
      languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    }
  });
  
  console.log("\n💻 Languages:");
  Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count}`);
    });
  
  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  repos.forEach(r => {
    if (r.categories && Array.isArray(r.categories)) {
      r.categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }
  });
  
  console.log("\n🏷️  Categories:");
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
  
  // Top builders
  const topBuilders = builders
    .sort((a, b) => b.reputation_score - a.reputation_score)
    .slice(0, 10);
  
  console.log("\n🏆 Top 10 Builders:");
  topBuilders.forEach((builder, i) => {
    const badges = [];
    const builderRepos = builder.quality_repos.map(id => store.repos[id]).filter(Boolean);
    
    if (builderRepos.some(r => r.isHot)) badges.push("🔥");
    if (builderRepos.some(r => r.isUnderrated)) badges.push("💎");
    if (builderRepos.some(r => r.isEarlyStage)) badges.push("🚀");
    
    console.log(`   ${i + 1}. ${builder.username} ${badges.join(" ")}`);
    console.log(`      Score: ${builder.reputation_score} | Repos: ${builder.quality_repos.length} | ${builder.focus_areas.join(", ")}`);
  });
  
  // Star distribution
  const starRanges = {
    "0-50": 0,
    "50-200": 0,
    "200-1000": 0,
    "1000+": 0
  };
  
  repos.forEach(r => {
    if (r.stars < 50) starRanges["0-50"]++;
    else if (r.stars < 200) starRanges["50-200"]++;
    else if (r.stars < 1000) starRanges["200-1000"]++;
    else starRanges["1000+"]++;
  });
  
  console.log("\n⭐ Star Distribution:");
  Object.entries(starRanges).forEach(([range, count]) => {
    console.log(`   ${range} stars: ${count}`);
  });
  
  // Average metrics (safe calculation with optional fields)
  const reposWithStarVelocity = repos.filter(r => r.starVelocity !== undefined && r.starVelocity !== null);
  const avgStarVelocity = reposWithStarVelocity.length > 0
    ? reposWithStarVelocity.reduce((sum, r) => sum + (r.starVelocity || 0), 0) / reposWithStarVelocity.length
    : 0;
  
  const reposWithAge = repos.filter(r => r.repoAgeInDays !== undefined && r.repoAgeInDays !== null);
  const avgRepoAge = reposWithAge.length > 0
    ? reposWithAge.reduce((sum, r) => sum + (r.repoAgeInDays || 0), 0) / reposWithAge.length
    : 0;
  
  const avgStars = repos.reduce((sum, r) => sum + r.stars, 0) / repos.length;
  
  console.log("\n📊 Averages:");
  console.log(`   Stars per repo: ${avgStars.toFixed(1)}`);
  console.log(`   Repo age: ${avgRepoAge.toFixed(0)} days`);
  if (reposWithStarVelocity.length > 0) {
    console.log(`   Star velocity: ${avgStarVelocity.toFixed(2)} stars/day`);
  }
  
  console.log("\n" + "═".repeat(70));
  console.log(`\n📅 Last updated: ${store.last_updated}\n`);
}

runStats();