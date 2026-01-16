"use client";

type FilterBarProps = {
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

export default function FilterBar({ setFilter }: FilterBarProps) {
  return (
    <div className="flex gap-3 mb-10 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setFilter(filter)}
          className="
            px-5 py-2
            rounded-full
            text-sm
            capitalize
            glass
            hover:border-white/30
            hover:text-white
            transition
          "
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
