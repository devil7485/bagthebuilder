"use client";

import { useEffect, useState } from "react";
import RepoCard from "@/components/RepoCard";
import { useParams } from "next/navigation";

type Repo = {
  id: number;
  name: string;
  description: string;
  stars: number;
  categories: string[];
  score: number;
};

export default function BuilderPage() {
  const { username } = useParams();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuilderRepos() {
      const res = await fetch(`/api/scan?owner=${username}`);
      const data = await res.json();
      setRepos(data);
      setLoading(false);
    }

    loadBuilderRepos();
  }, [username]);

  if (loading) {
    return <p className="p-10 text-white/60">Loading builder profile…</p>;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">@{username}</h1>

      <p className="text-white/60 max-w-2xl mb-6">
        This builder is actively shipping open-source projects with real usage,
        community interest, and technical depth.
      </p>

      <div className="bg-card border border-white/10 rounded-xl p-5 mb-10">
        <h2 className="font-semibold mb-2">Why this deserves a coin</h2>
        <ul className="list-disc ml-5 text-sm text-white/70 space-y-1">
          <li>Multiple active repositories</li>
          <li>Consistent commits and community interest</li>
          <li>Projects aligned with crypto / AI / public-good ecosystem</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo as any} />
        ))}
      </div>

      <div className="mt-12">
        <a
          href={`https://bags.fm`}
          target="_blank"
          className="inline-block bg-accent text-black px-6 py-3 rounded-xl font-bold"
        >
          Create a coin for @{username}
        </a>
      </div>
    </main>
  );
}
