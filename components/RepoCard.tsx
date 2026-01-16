import Link from "next/link";

type RepoCardProps = {
  repo: {
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
};

export default function RepoCard({ repo }: RepoCardProps) {
  const bagsUrl = `https://bags.fm?name=${encodeURIComponent(
    repo.coin.name
  )}&symbol=${encodeURIComponent(
    repo.coin.symbol
  )}&description=${encodeURIComponent(repo.coin.thesis)}`;

  return (
    <div className="relative group">
      {/* Glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition blur-lg" />

      <div className="relative glass rounded-2xl p-6 flex flex-col justify-between h-full">
        <Link href={`/builder/${repo.owner}`}>
          <div className="cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {repo.name}
              </h2>

              {repo.earlyStage && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  Early
                </span>
              )}
            </div>

            <p className="text-sm text-white/70 leading-relaxed">
              {repo.description}
            </p>

            <ul className="mt-4 text-xs text-white/60 space-y-1">
              {repo.coinReason.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2 mt-4">
              {repo.categories.map((c) => (
                <span
                  key={c}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 capitalize"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Link>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/60 mb-4">
            <span>⭐ {repo.stars}</span>
            <span>Score {repo.score}</span>
          </div>

          <a
            href={bagsUrl}
            target="_blank"
            className="
              block w-full text-center
              bg-accent text-black
              py-2.5 rounded-xl
              font-semibold
              hover:opacity-90
              transition
            "
          >
            Create coin
          </a>
        </div>
      </div>
    </div>
  );
}
