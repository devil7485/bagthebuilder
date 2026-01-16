"use client";

type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
};

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode
}: SearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Search Input */}
      <div className="flex-1 relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-accent/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition blur-sm" />
        <div className="relative glass rounded-2xl overflow-hidden">
          <input
            type="text"
            placeholder="Search builders, categories, bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-transparent text-white placeholder:text-white/40 outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            🔍
          </div>
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="relative glass rounded-2xl overflow-hidden">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-6 py-4 pr-12 bg-transparent text-white outline-none appearance-none cursor-pointer"
        >
          <option value="score">Sort by Score</option>
          <option value="repos">Sort by Repos</option>
          <option value="followers">Sort by Followers</option>
          <option value="recent">Sort by Recent</option>
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          ▼
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex glass rounded-2xl p-1.5">
        <button
          onClick={() => setViewMode("grid")}
          className={`
            px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
            ${
              viewMode === "grid"
                ? "bg-gradient-to-r from-accent to-accent/80 text-black"
                : "text-white/60 hover:text-white"
            }
          `}
        >
          Grid
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`
            px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
            ${
              viewMode === "list"
                ? "bg-gradient-to-r from-accent to-accent/80 text-black"
                : "text-white/60 hover:text-white"
            }
          `}
        >
          List
        </button>
      </div>
    </div>
  );
}