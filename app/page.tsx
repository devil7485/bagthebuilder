"use client";

import { useState, useEffect } from "react";
import RepoCard from "../components/RepoCard";
import FilterBar from "../components/FilterBar";
import AdvancedFilters, { FilterState } from "../components/AdvancedFilters";

type Repo = {
  id: number;
  builder: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  categories: string[];
  score: number;
  coinWorthy: boolean;
  // New fields
  blockchain?: string[];
  frameworks?: string[];
  daysSinceLastCommit?: number;
  repoAgeInDays?: number;
  starVelocity?: number;
  isUnderrated?: boolean;
  isEarlyStage?: boolean;
  isHot?: boolean;
  isActive?: boolean;
  quality?: {
    hasTests: boolean;
    hasCI: boolean;
    hasLicense: boolean;
    hasReadme: boolean;
  };
};

export default function HomePage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    activity: "all",
    blockchains: [],
    languages: [],
    hasTests: false,
    hasCI: false,
    hasLicense: false,
    showUnderrated: false,
    showEarlyStage: false,
    starRange: "all"
  });
  const [loading, setLoading] = useState(true);

  // Load repos from builders data
  useEffect(() => {
    fetch("/data/builders.json")
      .then((res) => res.json())
      .then((builders) => {
        console.log("Loaded builders:", builders);
        
        const allRepos: Repo[] = [];
        let idCounter = 1;
        
        builders.forEach((builder: any) => {
          if (!builder.topRepos || builder.topRepos.length === 0) return;
          
          builder.topRepos.forEach((repo: any) => {
            allRepos.push({
              id: idCounter++,
              builder: builder.username || "unknown",
              name: repo.name || "Unnamed Project",
              fullName: repo.fullName || `${builder.username}/${repo.name}`,
              description: repo.description || "No description available",
              url: repo.url || `https://github.com/${builder.username}/${repo.name}`,
              stars: repo.stars || 0,
              forks: repo.forks || 0,
              language: repo.language || null,
              categories: repo.categories || [],
              score: repo.score || 0,
              coinWorthy: repo.coinWorthy || false,
              // New fields
              blockchain: repo.blockchain || [],
              frameworks: repo.frameworks || [],
              daysSinceLastCommit: repo.daysSinceLastCommit,
              repoAgeInDays: repo.repoAgeInDays,
              starVelocity: repo.starVelocity,
              isUnderrated: repo.isUnderrated || false,
              isEarlyStage: repo.isEarlyStage || false,
              isHot: repo.isHot || false,
              isActive: repo.isActive || false,
              quality: repo.quality || {
                hasTests: false,
                hasCI: false,
                hasLicense: false,
                hasReadme: true
              }
            });
          });
        });

        console.log("Total repos extracted:", allRepos.length);
        allRepos.sort((a, b) => b.score - a.score);
        
        setRepos(allRepos);
        setFilteredRepos(allRepos);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load repos:", err);
        setLoading(false);
      });
  }, []);

  // Apply all filters
  useEffect(() => {
    let result = [...repos];

    // Category filter
    if (categoryFilter !== "All") {
      if (categoryFilter === "good") {
        result = result.filter((r) => r.coinWorthy);
      } else {
        result = result.filter((r) => r.categories.includes(categoryFilter));
      }
    }

    // Activity filter
    if (advancedFilters.activity !== "all") {
      if (advancedFilters.activity === "hot") {
        result = result.filter((r) => r.isHot);
      } else if (advancedFilters.activity === "active") {
        result = result.filter((r) => r.isActive);
      } else if (advancedFilters.activity === "quiet") {
        result = result.filter((r) => !r.isActive);
      }
    }

    // Blockchain filter
    if (advancedFilters.blockchains.length > 0) {
      result = result.filter((r) =>
        r.blockchain?.some((b) => advancedFilters.blockchains.includes(b))
      );
    }

    // Language filter
    if (advancedFilters.languages.length > 0) {
      result = result.filter((r) =>
        r.language && advancedFilters.languages.includes(r.language)
      );
    }

    // Star range filter
    if (advancedFilters.starRange !== "all") {
      const ranges = {
        "0-50": [0, 50],
        "50-200": [50, 200],
        "200-1000": [200, 1000],
        "1000+": [1000, Infinity]
      };
      const [min, max] = ranges[advancedFilters.starRange as keyof typeof ranges];
      result = result.filter((r) => r.stars >= min && r.stars < max);
    }

    // Quality filters
    if (advancedFilters.hasTests) {
      result = result.filter((r) => r.quality?.hasTests);
    }
    if (advancedFilters.hasCI) {
      result = result.filter((r) => r.quality?.hasCI);
    }
    if (advancedFilters.hasLicense) {
      result = result.filter((r) => r.quality?.hasLicense);
    }

    // Special signals
    if (advancedFilters.showUnderrated) {
      result = result.filter((r) => r.isUnderrated);
    }
    if (advancedFilters.showEarlyStage) {
      result = result.filter((r) => r.isEarlyStage);
    }

    setFilteredRepos(result);
  }, [repos, categoryFilter, advancedFilters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center">
          <div className="text-8xl mb-6">📦</div>
          <h1 className="text-4xl font-black mb-4">No Repositories Yet</h1>
          <p className="text-white/60 mb-8 max-w-md">
            Run the scanner to find builders and their projects!
          </p>
          <div className="glass rounded-2xl p-6 max-w-md mx-auto text-left">
            <p className="text-sm text-white/70 mb-4">To populate the database:</p>
            <code className="block bg-black/50 rounded-lg p-4 text-sm">
              npm run scan<br/>
              npm run export
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-bold border border-accent/30">
                🎒 BAG THE BUILDER
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent animate-gradient">
                Discover
              </span>
              <br />
              <span className="text-white">Underrated Projects</span>
            </h1>

            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Quality repositories from individual builders in crypto, AI, privacy, and more.
              Support their work by creating coins on Bags.fm.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-4">
                <div className="text-3xl font-black text-accent">{repos.length}</div>
                <div className="text-sm text-white/60">Repositories</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-3xl font-black text-white">
                  {new Set(repos.map(r => r.builder)).size}
                </div>
                <div className="text-sm text-white/60">Builders</div>
              </div>
              <div className="glass rounded-2xl p-4 col-span-2 md:col-span-1">
                <div className="text-3xl font-black text-green-400">
                  {repos.filter(r => r.coinWorthy).length}
                </div>
                <div className="text-sm text-white/60">🎯 Coin-Worthy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <FilterBar filter={categoryFilter} setFilter={setCategoryFilter} />
            
            <AdvancedFilters onFilterChange={setAdvancedFilters} />

            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/60">
                {filteredRepos.length} project{filteredRepos.length !== 1 ? "s" : ""} found
                {categoryFilter !== "All" && ` in ${categoryFilter}`}
              </p>
            </div>
          </div>
        </section>

        {/* Repos Grid */}
        <section className="container mx-auto px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            {filteredRepos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">No projects found</h3>
                <p className="text-white/60">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}