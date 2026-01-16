import { loadStore, getTopBuilders, getCoinWorthyRepos, getBuildersByCategory } from "./storage";
import fs from "fs";
import path from "path";

/**
 * Auto-export script - runs after scanning
 * Exports data with ALL new metrics for frontend
 */
function autoExport() {
  console.log("📦 Auto-exporting data for frontend...\n");
  
  const store = loadStore();

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
        coinWorthy: r.coin_worthy,
        
        // 🔥 NEW METRICS FOR FRONTEND
        blockchain: r.blockchain || [],
        frameworks: r.frameworks || [],
        daysSinceLastCommit: r.daysSinceLastCommit,
        repoAgeInDays: r.repoAgeInDays,
        starVelocity: r.starVelocity,
        isUnderrated: r.isUnderrated || false,
        isEarlyStage: r.isEarlyStage || false,
        isActive: r.isActive || false,
        isHot: r.isHot || false,
        quality: {
          hasReadme: r.quality?.hasReadme || true,
          hasTests: r.quality?.hasTests || false,
          hasCI: r.quality?.hasCI || false,
          hasLicense: r.quality?.hasLicense || false
        }
      }))
    };
  });

  // Export by category
  const categories = ["crypto", "ai", "infra", "privacy", "games", "api", "agi", "tools", "defi", "wallet", "nft", "mev", "dao", "bridge"];
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
    language: repo.language,
    blockchain: repo.blockchain || [],
    isHot: repo.isHot || false,
    isUnderrated: repo.isUnderrated || false
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

  // Enhanced summary with new metrics
  const allRepos = Object.values(store.repos) as any[];
  const hotRepos = allRepos.filter(r => r.isHot).length;
  const underratedRepos = allRepos.filter(r => r.isUnderrated).length;
  const earlyStageRepos = allRepos.filter(r => r.isEarlyStage).length;
  const withTests = allRepos.filter(r => r.quality?.hasTests).length;
  const withCI = allRepos.filter(r => r.quality?.hasCI).length;
  const withLicense = allRepos.filter(r => r.quality?.hasLicense).length;
  const blockchainRepos = allRepos.filter(r => r.blockchain?.length > 0).length;
  
  // Blockchain breakdown
  const blockchainBreakdown: Record<string, number> = {};
  allRepos.forEach(r => {
    if (r.blockchain && Array.isArray(r.blockchain)) {
      r.blockchain.forEach((chain: string) => {
        blockchainBreakdown[chain] = (blockchainBreakdown[chain] || 0) + 1;
      });
    }
  });
  
  // Language breakdown
  const languageBreakdown: Record<string, number> = {};
  allRepos.forEach(r => {
    if (r.language) {
      languageBreakdown[r.language] = (languageBreakdown[r.language] || 0) + 1;
    }
  });

  const summary = {
    totalBuilders: buildersOutput.length,
    totalRepos: Object.keys(store.repos).length,
    coinWorthyRepos: coinWorthyRepos.length,
    
    // Activity breakdown
    hotRepos,
    activeRepos: allRepos.filter(r => r.isActive).length,
    quietRepos: allRepos.filter(r => !r.isActive).length,
    
    // Discovery signals
    underratedRepos,
    earlyStageRepos,
    
    // Quality signals
    withTests,
    withCI,
    withLicense,
    
    // Tech breakdown
    blockchainRepos,
    blockchainBreakdown,
    languageBreakdown,
    
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

  console.log("✅ Auto-export complete!\n");
  console.log(`   📁 builders.json: ${buildersOutput.length} builders`);
  console.log(`   📁 coin-worthy.json: ${coinWorthyRepos.length} repos`);
  console.log(`   📁 categories.json: ${Object.keys(byCategory).length} categories`);
  console.log(`\n🔥 Quality breakdown:`);
  console.log(`   - Hot repos (< 7d): ${hotRepos}`);
  console.log(`   - Hidden gems: ${underratedRepos}`);
  console.log(`   - Early stage: ${earlyStageRepos}`);
  console.log(`   - With tests: ${withTests}`);
  console.log(`   - With CI/CD: ${withCI}`);
  console.log(`   - Blockchain tagged: ${blockchainRepos}`);
  console.log(`\n⛓️  Blockchain breakdown:`);
  Object.entries(blockchainBreakdown).forEach(([chain, count]) => {
    console.log(`   - ${chain}: ${count}`);
  });
  console.log(`\n💻 Top languages:`);
  Object.entries(languageBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([lang, count]) => {
      console.log(`   - ${lang}: ${count}`);
    });
  console.log(`\n📂 Location: ${exportDir}\n`);
}

// Run auto-export
autoExport();