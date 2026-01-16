"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Builder = {
  username: string;
  name: string | null;
  avatar: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  followers: number;
  focusAreas: string[];
  reputationScore: number;
  consistencyScore: number;
  lastActive: string;
  topRepos: Array<{
    name: string;
    fullName: string;
    description: string;
    url: string;
    stars: number;
    forks: number;
    language: string | null;
    topics: string[];
    categories: string[];
    score: number;
    coinWorthy: boolean;
  }>;
};

export default function BuilderPage() {
  const params = useParams();
  const username = params.username as string;
  
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetch("/data/builders.json")
      .then((res) => res.json())
      .then((data: Builder[]) => {
        const found = data.find((b) => b.username === username);
        setBuilder(found || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading builder profile...</p>
        </div>
      </div>
    );
  }

  if (!builder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="text-center">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-4xl font-black mb-4">Builder Not Found</h1>
          <p className="text-white/60 mb-8">
            We couldn't find a builder with username "{username}"
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-accent text-black font-bold rounded-xl hover:shadow-lg hover:shadow-accent/50 transition"
          >
            Back to Builders
          </Link>
        </div>
      </div>
    );
  }

  const coinWorthyRepos = builder.topRepos.filter((r) => r.coinWorthy);

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <div className="container mx-auto px-6 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition"
          >
            <span>←</span>
            <span>Back to Builders</span>
          </Link>
        </div>

        {/* Profile Header */}
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-accent/40 via-purple-500/40 to-accent/40 opacity-50 blur-xl" />
              
              <div className="relative glass rounded-3xl p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Avatar */}
                  <div className="relative w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 ring-4 ring-accent/30">
                    {!imageError ? (
                      <img
                        src={builder.avatar}
                        alt={builder.username}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/30 to-purple-500/30 flex items-center justify-center text-5xl font-bold">
                        {builder.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-4xl font-black mb-2">
                          {builder.name || builder.username}
                        </h1>
                        <p className="text-xl text-white/50">@{builder.username}</p>
                      </div>

                      <div className="px-6 py-3 rounded-2xl bg-accent/10 border border-accent/30">
                        <div className="text-4xl font-black text-accent leading-none mb-1">
                          {builder.reputationScore}
                        </div>
                        <div className="text-xs text-white/50">SCORE</div>
                      </div>
                    </div>

                    {builder.bio && (
                      <p className="text-lg text-white/70 mb-6 leading-relaxed">
                        {builder.bio}
                      </p>
                    )}

                    {/* Focus Areas */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {builder.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold capitalize border border-white/20"
                        >
                          {area}
                        </span>
                      ))}
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-white/50 mb-1">Followers</div>
                        <div className="font-bold text-lg">{builder.followers}</div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Repos</div>
                        <div className="font-bold text-lg">{builder.topRepos.length}</div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Coin-Worthy</div>
                        <div className="font-bold text-lg text-accent">
                          {coinWorthyRepos.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Consistency</div>
                        <div className="font-bold text-lg">{builder.consistencyScore}</div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-3 mt-6">
                      <a
                        href={`https://github.com/${builder.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-sm transition"
                      >
                        GitHub Profile →
                      </a>
                      {builder.twitter && (
                        <a
                          href={`https://twitter.com/${builder.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-sm transition"
                        >
                          Twitter →
                        </a>
                      )}
                      {builder.website && (
                        <a
                          href={builder.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-sm transition"
                        >
                          Website →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Repositories */}
        <section className="container mx-auto px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black mb-8">
              Top Repositories ({builder.topRepos.length})
            </h2>

            <div className="space-y-4">
              {builder.topRepos.map((repo) => (
                <div
                  key={repo.fullName}
                  className="relative group"
                >
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-accent/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition blur-sm" />
                  
                  <div className="relative glass rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold hover:text-accent transition"
                          >
                            {repo.name}
                          </a>
                          {repo.coinWorthy && (
                            <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold border border-accent/30">
                              🎯 COIN-WORTHY
                            </span>
                          )}
                        </div>
                        <p className="text-white/70 mb-4">{repo.description}</p>

                        {/* Topics */}
                        {repo.topics && repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {repo.topics.slice(0, 5).map((topic) => (
                              <span
                                key={topic}
                                className="px-2 py-1 rounded-lg bg-white/5 text-xs border border-white/10"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                          {repo.categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold capitalize border border-white/20"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="ml-6 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 flex-shrink-0">
                        <div className="text-2xl font-black text-accent leading-none">
                          {repo.score}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-white/50 pt-4 border-t border-white/10">
                      <span className="flex items-center gap-1">
                        ⭐ <strong className="text-white">{repo.stars}</strong> stars
                      </span>
                      <span className="flex items-center gap-1">
                        🔀 <strong className="text-white">{repo.forks}</strong> forks
                      </span>
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          💻 <strong className="text-white">{repo.language}</strong>
                        </span>
                      )}
                    </div>

                    {/* Bags.fm Button */}
                    {repo.coinWorthy && (
                      <div className="mt-4">
                        <a
                          href={`https://bags.fm?name=${encodeURIComponent(repo.name)}&symbol=${encodeURIComponent(repo.name.toUpperCase().slice(0, 4))}&description=${encodeURIComponent(repo.description)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-black font-bold hover:shadow-lg hover:shadow-accent/50 transition"
                        >
                          🎒 Create Coin on Bags.fm
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}