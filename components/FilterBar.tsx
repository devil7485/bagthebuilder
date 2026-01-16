"use client";

type FilterBarProps = {
  filter: string;
  setFilter: (filter: string) => void;
};

const filters = [
  "All",
  "crypto",
  "ai",
  "privacy",
  "games",
  "infra",
  "good"
];

export default function FilterBar({ filter, setFilter }: FilterBarProps) {
  return (
    <div className="flex gap-3 mb-10 flex-wrap">
      {filters.map((f) => {
        const isActive = filter === f;
        
        return (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-5 py-2
              rounded-full
              text-sm
              capitalize
              font-semibold
              transition-all
              ${
                isActive
                  ? "bg-gradient-to-r from-accent to-accent/80 text-black shadow-lg shadow-accent/30"
                  : "glass hover:border-accent/50 hover:text-accent hover:bg-accent/10"
              }
            `}
          >
            {f === "good" ? "🎯 Coin-Worthy" : f}
          </button>
        );
      })}
    </div>
  );
}