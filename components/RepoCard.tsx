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
};

export default function RepoCard({ repo }: RepoCardProps) {
  const bagsUrl = "https://bags.fm/?ref=emmabaeeex";

  return (
    <div className="relative group h-full">
      {/* Animated glow on hover */}
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-accent/40 via-purple-500/40 to-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />

      <div className="relative glass rounded-2xl p-6 flex flex-col justify-between h-full">
        {/* Header */}
        <div>
          {/* Badges Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {repo.isHot && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                🔥 Hot
              </span>
            )}
            {repo.isUnderrated && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                💎 Hidden Gem
              </span>
            )}
            {repo.isEarlyStage && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-bold border border-green-500/30">
                🚀 Early
              </span>
            )}
            {repo.coinWorthy && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-bold border border-accent/30">
                🎯 Coin-Worthy
              </span>
            )}
          </div>

          {/* Title & Builder */}
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
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 leading-relaxed mb-4 line-clamp-3">
            {repo.description}
          </p>

          {/* Blockchain Tags */}
          {repo.blockchain && repo.blockchain.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {repo.blockchain.map((chain) => (
                <span
                  key={chain}
                  className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 capitalize border border-purple-500/30 font-semibold"
                >
                  ⛓️ {chain}
                </span>
              ))}
            </div>
          )}

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

          {/* Quality Indicators */}
          {repo.quality && (
            <div className="flex items-center gap-2 mb-4">
              {repo.quality.hasTests && (
                <span className="text-xs text-green-400" title="Has Tests">
                  ✓ Tests
                </span>
              )}
              {repo.quality.hasCI && (
                <span className="text-xs text-blue-400" title="Has CI/CD">
                  ✓ CI/CD
                </span>
              )}
              {repo.quality.hasLicense && (
                <span className="text-xs text-yellow-400" title="Has License">
                  ✓ License
                </span>
              )}
            </div>
          )}

          {/* Stats Row */}
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
          </div>

          {/* Activity Info */}
          {repo.daysSinceLastCommit !== undefined && (
            <div className="text-xs text-white/50 mb-4">
              Last commit: {repo.daysSinceLastCommit}d ago
              {repo.starVelocity && repo.starVelocity > 0.5 && (
                <span className="ml-2 text-accent">
                  • {repo.starVelocity.toFixed(1)} ⭐/day
                </span>
              )}
            </div>
          )}

          {/* Score */}
          <div className="text-right">
            <span className="text-xs text-white/50">
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
            mt-4
          "
        >
          🎒 Create Coin
        </a>
      </div>
    </div>
  );
}