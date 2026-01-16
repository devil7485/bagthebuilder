import dotenv from "dotenv";
import { loadStore, saveStore } from "./storage";
import { evaluateRepo, evaluateBuilder } from "./evaluate";

dotenv.config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN missing");

/**
 * GraphQL Scanner - Much more efficient than REST API
 * Can fetch user + repos + metadata in a single request
 */

interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

/**
 * Execute GraphQL query
 */
async function graphqlQuery(query: string, variables: any = {}): Promise<any> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  const result: GraphQLResponse = await response.json();
  
  if (result.errors) {
    console.error("GraphQL errors:", result.errors);
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

/**
 * Search for users with detailed profile + repos in one query
 */
const SEARCH_USERS_QUERY = `
  query SearchUsers($query: String!, $first: Int!) {
    search(query: $query, type: USER, first: $first) {
      userCount
      nodes {
        ... on User {
          id
          login
          name
          avatarUrl
          bio
          location
          websiteUrl
          twitterUsername
          followers {
            totalCount
          }
          repositories(
            first: 30
            orderBy: { field: PUSHED_AT, direction: DESC }
            ownerAffiliations: OWNER
            isFork: false
          ) {
            totalCount
            nodes {
              id
              name
              nameWithOwner
              description
              url
              isArchived
              isFork
              
              stargazerCount
              forkCount
              watchers {
                totalCount
              }
              issues {
                totalCount
              }
              
              primaryLanguage {
                name
              }
              
              repositoryTopics(first: 10) {
                nodes {
                  topic {
                    name
                  }
                }
              }
              
              licenseInfo {
                key
                name
              }
              
              createdAt
              updatedAt
              pushedAt
              
              hasIssuesEnabled
              hasWikiEnabled
              diskUsage
            }
          }
        }
      }
    }
  }
`;

/**
 * Convert GraphQL repo to REST format
 */
function convertGraphQLRepo(repo: any, owner: any): any {
  return {
    id: parseInt(repo.id.replace(/\D/g, '')),
    name: repo.name,
    full_name: repo.nameWithOwner,
    html_url: repo.url,
    description: repo.description,
    fork: repo.isFork,
    archived: repo.isArchived,
    
    stargazers_count: repo.stargazerCount,
    forks_count: repo.forkCount,
    open_issues_count: repo.issues.totalCount,
    watchers_count: repo.watchers.totalCount,
    
    owner: {
      id: parseInt(owner.id.replace(/\D/g, '')),
      login: owner.login,
      type: "User",
      avatar_url: owner.avatarUrl,
      html_url: `https://github.com/${owner.login}`
    },
    
    created_at: repo.createdAt,
    updated_at: repo.updatedAt,
    pushed_at: repo.pushedAt,
    
    language: repo.primaryLanguage?.name || null,
    topics: repo.repositoryTopics.nodes.map((t: any) => t.topic.name),
    
    size: repo.diskUsage,
    has_issues: repo.hasIssuesEnabled,
    has_wiki: repo.hasWikiEnabled,
    license: repo.licenseInfo
  };
}

/**
 * Convert GraphQL user to REST format
 */
function convertGraphQLUser(user: any): any {
  return {
    id: parseInt(user.id.replace(/\D/g, '')),
    login: user.login,
    avatar_url: user.avatarUrl,
    html_url: `https://github.com/${user.login}`,
    type: "User",
    name: user.name,
    bio: user.bio,
    location: user.location,
    blog: user.websiteUrl,
    twitter_username: user.twitterUsername,
    public_repos: user.repositories.totalCount,
    followers: user.followers.totalCount,
    following: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Process user from GraphQL result
 */
async function processGraphQLUser(userNode: any, store: any): Promise<boolean> {
  const user = convertGraphQLUser(userNode);
  const username = user.login;

  // Skip if recently scanned
  const existingBuilder = store.builders[username];
  if (existingBuilder) {
    const hoursSinceLastScan = (Date.now() - new Date(existingBuilder.last_scanned_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastScan < 24) {
      return false;
    }
  }

  console.log(`\n🔍 Processing: ${username} (${user.followers} followers, ${user.public_repos} repos)`);

  // Check follower range
  const MIN_FOLLOWERS = 20;
  const MAX_FOLLOWERS = 2000;
  
  if (user.followers < MIN_FOLLOWERS || user.followers > MAX_FOLLOWERS) {
    console.log(`  ⏭️  Skipped: followers out of range`);
    return false;
  }

  const qualityRepoIds: number[] = [];
  let totalScore = 0;

  // Process repos
  for (const repoNode of userNode.repositories.nodes) {
    const repo = convertGraphQLRepo(repoNode, userNode);

    // Skip if already stored
    if (store.repos[repo.id]) {
      qualityRepoIds.push(repo.id);
      continue;
    }

    // Skip high-star repos
    if (repo.stargazers_count > 5000) continue;

    // Evaluate
    const evalResult = evaluateRepo(repo);
    if (!evalResult) continue;

    console.log(`    ✅ ${repo.name} - Score: ${evalResult.score}${evalResult.coinWorthy ? " 🎯" : ""}`);

    // Store repo
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
      topics: repo.topics,
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

  // Evaluate builder
  const builderEval = evaluateBuilder(user, qualityRepoIds);
  if (!builderEval.accepted) {
    console.log(`  ❌ Builder rejected: ${builderEval.reason}`);
    return false;
  }

  // Detect focus areas
  const focusAreas = [...new Set(
    qualityRepoIds
      .map(id => store.repos[id]?.categories || [])
      .flat()
  )];

  // Store builder
  store.builders[username] = {
    id: user.id,
    username: user.login,
    name: user.name,
    avatar: user.avatar_url,
    profile_url: user.html_url,
    bio: user.bio,
    location: user.location,
    website: user.blog,
    twitter: user.twitter_username,
    total_repos: user.public_repos,
    quality_repos: qualityRepoIds,
    focus_areas: focusAreas,
    followers: user.followers,
    public_repos: user.public_repos,
    reputation_score: builderEval.score,
    consistency_score: Math.round(totalScore / qualityRepoIds.length) || 0,
    first_seen_at: existingBuilder?.first_seen_at || new Date().toISOString(),
    last_active_at: userNode.repositories.nodes[0]?.pushedAt || new Date().toISOString(),
    last_scanned_at: new Date().toISOString()
  };

  console.log(`  ✨ Builder accepted! Score: ${builderEval.score} | Quality repos: ${qualityRepoIds.length} | Focus: ${focusAreas.join(", ")}`);
  return true;
}

/**
 * Main GraphQL scan
 */
async function runGraphQLScan() {
  const store = loadStore();
  
  console.log("🚀 Starting GraphQL scan (ultra-fast mode)...\n");
  console.log("═".repeat(70));

  let newBuildersFound = 0;
  let processedUsers = 0;

  const topics = ["crypto", "web3", "defi", "ai", "llm", "blockchain"];
  
  for (const topic of topics) {
    console.log(`\n🎯 Searching topic: ${topic}`);
    
    const query = `followers:20..2000 repos:>5 topic:${topic}`;
    
    try {
      const data = await graphqlQuery(SEARCH_USERS_QUERY, {
        query,
        first: 20
      });

      console.log(`   Found ${data.search.userCount} users (processing first 20)`);

      for (const userNode of data.search.nodes) {
        if (!userNode) continue;
        
        const success = await processGraphQLUser(userNode, store);
        if (success) newBuildersFound++;
        processedUsers++;

        // Save progress every 5 users
        if (processedUsers % 5 === 0) {
          saveStore(store);
          console.log(`\n💾 Progress saved`);
        }

        // Small delay to be nice to API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Error searching ${topic}:`, error);
    }
  }

  saveStore(store);

  console.log("\n" + "═".repeat(70));
  console.log("🎉 GraphQL scan complete!");
  console.log(`📊 Stats:`);
  console.log(`   - Users processed: ${processedUsers}`);
  console.log(`   - New builders found: ${newBuildersFound}`);
  console.log(`   - Total builders: ${Object.keys(store.builders).length}`);
  console.log(`   - Total repos: ${Object.keys(store.repos).length}`);
  console.log("═".repeat(70));
}

runGraphQLScan().catch(err => {
  console.error("\n❌ GraphQL scan failed:", err);
  process.exit(1);
});