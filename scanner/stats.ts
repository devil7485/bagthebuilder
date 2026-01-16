import { loadStore, getStats, getTopBuilders, getCoinWorthyRepos } from "./storage";

function displayStats() {
  const store = loadStore();
  const stats = getStats(store);

  console.log("\n" + "═".repeat(70));
  console.log("📊 BAG THE BUILDER - STATISTICS");
  console.log("═".repeat(70));

  console.log("\n📈 Overview:");
  console.log(`   Total Builders: ${stats.totalBuilders}`);
  console.log(`   Total Repos: ${stats.totalRepos}`);
  console.log(`   Coin-Worthy Repos: ${stats.coinWorthyRepos}`);
  console.log(`   Avg Repos per Builder: ${stats.avgReposPerBuilder}`);
  console.log(`   Last Scanned: ${new Date(stats.lastScanned).toLocaleString()}`);

  console.log("\n🎯 Categories:");
  const sortedCategories = Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [category, count] of sortedCategories) {
    console.log(`   ${category.padEnd(15)}: ${count} builders`);
  }

  console.log("\n🏆 Top 10 Builders:");
  const topBuilders = getTopBuilders(store, 10);
  
  for (let i = 0; i < topBuilders.length; i++) {
    const builder = topBuilders[i];
    console.log(`   ${(i + 1).toString().padStart(2)}. ${builder.username.padEnd(20)} | Score: ${builder.reputation_score.toString().padStart(3)} | Repos: ${builder.quality_repos.length} | Focus: ${builder.focus_areas.join(", ")}`);
  }

  console.log("\n💎 Top 10 Coin-Worthy Repos:");
  const coinWorthyRepos = getCoinWorthyRepos(store).slice(0, 10);
  
  for (let i = 0; i < coinWorthyRepos.length; i++) {
    const repo = coinWorthyRepos[i];
    console.log(`   ${(i + 1).toString().padStart(2)}. ${repo.full_name.padEnd(35)} | Score: ${repo.final_score.toString().padStart(3)} | ⭐ ${repo.stars}`);
  }

  console.log("\n" + "═".repeat(70) + "\n");
}

displayStats();