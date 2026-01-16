"use client";

type StatsBarProps = {
  totalBuilders: number;
  totalRepos: number;
  coinWorthy: number;
};

export default function StatsBar({
  totalBuilders,
  totalRepos,
  coinWorthy
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
      {/* Total Builders */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/40 to-transparent opacity-50 group-hover:opacity-100 transition blur" />
        <div className="relative glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-accent mb-2">
            {totalBuilders}
          </div>
          <div className="text-sm text-white/60 font-semibold">
            Quality Builders
          </div>
        </div>
      </div>

      {/* Total Repos */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/40 to-transparent opacity-50 group-hover:opacity-100 transition blur" />
        <div className="relative glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-white mb-2">
            {totalRepos}
          </div>
          <div className="text-sm text-white/60 font-semibold">
            Curated Repos
          </div>
        </div>
      </div>

      {/* Coin Worthy */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-green-500/40 to-transparent opacity-50 group-hover:opacity-100 transition blur" />
        <div className="relative glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-green-400 mb-2">
            {coinWorthy}
          </div>
          <div className="text-sm text-white/60 font-semibold">
            🎯 Coin-Worthy
          </div>
        </div>
      </div>
    </div>
  );
}