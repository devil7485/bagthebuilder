import fs from "fs";
import path from "path";
import { loadStore, getTopBuilders, getCoinWorthyRepos, getBuildersByCategory } from "./storage";

/**
 * Export data for frontend consumption
 */
function exportData() {
  const store = loadStore();

  console.log("📦 Exporting data for frontend...\n");

  // Export top builders
  const topBuilders = getTopBuilders(store, 100);
  const buildersOutput = topBuilders.map(builder => {
    const repos = builder.quality_repos
      .map(id => store.repos[id])
      .filter(Boolean)
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 5); // Top 5 repos per builder

    return {
      username: builder.username,
      name: builder.name,
      avatar: builder.avatar,
      bio: builder.bio,
      location: builder.location,
      website: builder.website,
      twitter: builder.twitter,
      followers: builder.followers,
      focusAreas: builder.focus_areas,
      reputationScore: builder.reputation_score,
      consistencyScore: builder.consistency_score,
      lastActive: builder.last_active_at,
      topRepos: repos.map(r => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.url,
        stars: r.stars,
        forks: r.forks,
        language: r.language,
        topics: r.topics,
        categories: r.categories,
        score: r.final_score,
        coinWorthy: r.coin_worthy
      }))
    };
  });

  // Export by category
  const categories = ["crypto", "ai", "infra", "privacy", "games", "api", "agi", "tools"];
  const byCategory: Record<string, any[]> = {};

  for (const category of categories) {
    const builders = getBuildersByCategory(store, category).slice(0, 50);
    byCategory[category] = builders.map(b => b.username);
  }

  // Export coin-worthy repos
  const coinWorthyRepos = getCoinWorthyRepos(store).map(repo => ({
    fullName: repo.full_name,
    builder: repo.builder,
    description: repo.description,
    url: repo.url,
    stars: repo.stars,
    categories: repo.categories,
    score: repo.final_score,
    language: repo.language
  }));

  // Create exports directory
  const exportDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Write files
  fs.writeFileSync(
    path.join(exportDir, "builders.json"),
    JSON.stringify(buildersOutput, null, 2)
  );

  fs.writeFileSync(
    path.join(exportDir, "categories.json"),
    JSON.stringify(byCategory, null, 2)
  );

  fs.writeFileSync(
    path.join(exportDir, "coin-worthy.json"),
    JSON.stringify(coinWorthyRepos, null, 2)
  );

  // Summary
  const summary = {
    totalBuilders: buildersOutput.length,
    totalRepos: Object.keys(store.repos).length,
    coinWorthyRepos: coinWorthyRepos.length,
    categories: Object.keys(byCategory).reduce((acc, cat) => {
      acc[cat] = byCategory[cat].length;
      return acc;
    }, {} as Record<string, number>),
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(exportDir, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log("✅ Export complete!\n");
  console.log(`   📁 builders.json: ${buildersOutput.length} builders`);
  console.log(`   📁 coin-worthy.json: ${coinWorthyRepos.length} repos`);
  console.log(`   📁 categories.json: ${Object.keys(byCategory).length} categories`);
  console.log(`   📁 summary.json: metadata\n`);
  console.log(`   📂 Location: ${exportDir}\n`);
}

exportData();