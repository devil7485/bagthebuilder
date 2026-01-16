"use client";

import { useEffect, useMemo, useState } from "react";
import RepoCard from "../components/RepoCard";
import RepoListRow from "../components/RepoListRow";
import FilterBar from "../components/FilterBar";

type Repo = {
  id: number;
  name: string;
  description: string;
  stars: number;
  owner: string;
  categories: string[];
  score: number;
  earlyStage: boolean;
  coinReason: string[];
  coin: {
    name: string;
    symbol: string;
    thesis: string;
  };
};

type SortOption = "score" | "stars";

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [view, setView] = useState<"card" | "list">("card");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scan")
      .then((res) => res.json())
      .then((data) => setRepos(data))
      .finally(() => setLoading(false));
  }, []);

  const processedRepos = useMemo(() => {
    let data = [...repos];

    // category filter
    if (filter !== "All") {
      data = data.filter((r) =>
        r.categories.includes(filter.toLowerCase())
      );
    }

    // sorting
    if (sortBy === "stars") {
      data.sort((a, b) => b.stars - a.stars);
    } else {
      data.sort((a, b) => b.score - a.score);
    }

    return data;
  }, [repos, filter, sortBy]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">
          Support underrated builders
        </h1>
        <p className="text-white/60 text-lg">
          Scan hundreds of real crypto-native builders shipping products.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <FilterBar setFilter={setFilter} />

        <div className="flex gap-3 items-center">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="score">Sort by score</option>
            <option value="stars">Sort by stars</option>
          </select>

          {/* View toggle */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("card")}
              className={`px-4 py-2 text-sm ${
                view === "card"
                  ? "bg-accent text-black"
                  : "bg-card"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-sm ${
                view === "list"
                  ? "bg-accent text-black"
                  : "bg-card"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-white/50">
          Scanning GitHub (200+ real builders)…
        </p>
      ) : processedRepos.length === 0 ? (
        <p className="text-white/50">
          No builders found for this category.
        </p>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {processedRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {processedRepos.map((repo) => (
            <RepoListRow key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </main>
  );
}
