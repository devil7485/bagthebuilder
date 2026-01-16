"use client";

import Link from "next/link";

type RepoCardProps = {
  repo: {
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
  };
};

export default function RepoCard({ repo }: RepoCardProps) {
  // Generate Bags.fm URL
  const bagsUrl = `https://bags.fm?name=${encodeURIComponent(
    repo.name
  )}&symbol=${encodeURIComponent(
    repo.name.toUpperCase().slice(0, 4)
  )}&description=${encodeURIComponent(repo.description)}`;

  return (
    <div className="relative group h-full">
      {/* Animated glow on hover */}
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-accent/40 via-purple-500/40 to-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />

      <div className="relative glass rounded-2xl p-6 flex flex-col justify-between h-full">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold hover:text-accent transition block truncate"
              >
                {repo.name}
              </a>
              <Link
                href={`/builder/${repo.builder}`}
                className="text-sm text-white/50 hover:text-accent transition"
              >
                by @{repo.builder}
              </Link>
            </div>

            {/* Coin-worthy badge */}
            {repo.coinWorthy && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-bold border border-accent/30 flex-shrink-0 ml-2">
                🎯
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 leading-relaxed mb-4 line-clamp-3">
            {repo.description}
          </p>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {repo.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-3 py-1 rounded-full bg-white/5 capitalize border border-white/10"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span className="flex items-center gap-1">
              ⭐ <strong className="text-white">{repo.stars}</strong>
            </span>
            <span className="flex items-center gap-1">
              🔀 <strong className="text-white">{repo.forks}</strong>
            </span>
            {repo.language && (
              <span className="flex items-center gap-1">
                💻 <strong className="text-white">{repo.language}</strong>
              </span>
            )}
            <span className="ml-auto">
              Score <strong className="text-accent">{repo.score}</strong>
            </span>
          </div>
        </div>

        {/* Create Coin Button */}
        <a
          href={bagsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            block w-full text-center
            bg-gradient-to-r from-accent to-accent/80
            text-black
            py-3 rounded-xl
            font-bold
            hover:shadow-lg hover:shadow-accent/50
            transition-all
            hover:-translate-y-0.5
          "
        >
          🎒 Create Coin
        </a>
      </div>
    </div>
  );
}