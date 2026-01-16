import Link from "next/link";

type RepoListRowProps = {
  repo: {
    id: number;
    name: string;
    description: string;
    stars: number;
    owner: string;
    score: number;
    coin: {
      name: string;
      symbol: string;
      thesis: string;
    };
  };
};

export default function RepoListRow({ repo }: RepoListRowProps) {
  const bagsUrl = `https://bags.fm?name=${encodeURIComponent(
    repo.coin.name
  )}&symbol=${encodeURIComponent(
    repo.coin.symbol
  )}&description=${encodeURIComponent(repo.coin.thesis)}`;

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 hover:bg-white/5 transition">
      {/* Left */}
      <div className="flex-1 pr-6">
        <Link
          href={`/builder/${repo.owner}`}
          className="font-medium hover:underline"
        >
          {repo.name}
        </Link>
        <p className="text-sm text-white/60 mt-1 line-clamp-1">
          {repo.description}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6 text-sm text-white/60">
        <span>⭐ {repo.stars}</span>
        <span>Score {repo.score}</span>

        <a
          href={bagsUrl}
          target="_blank"
          className="px-4 py-2 bg-accent text-black rounded-lg font-semibold hover:opacity-90 transition"
        >
          Create coin
        </a>
      </div>
    </div>
  );
}
