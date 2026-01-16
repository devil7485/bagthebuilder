"use client";

import { useState } from "react";

type AdvancedFiltersProps = {
  onFilterChange: (filters: FilterState) => void;
};

export type FilterState = {
  // Activity
  activity: "all" | "hot" | "active" | "quiet";
  
  // Blockchain
  blockchains: string[];
  
  // Language
  languages: string[];
  
  // Quality
  hasTests: boolean;
  hasCI: boolean;
  hasLicense: boolean;
  
  // Underrated signals
  showUnderrated: boolean;
  showEarlyStage: boolean;
  
  // Stars
  starRange: "all" | "0-50" | "50-200" | "200-1000" | "1000+";
};

const defaultFilters: FilterState = {
  activity: "all",
  blockchains: [],
  languages: [],
  hasTests: false,
  hasCI: false,
  hasLicense: false,
  showUnderrated: false,
  showEarlyStage: false,
  starRange: "all"
};

export default function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleBlockchain = (chain: string) => {
    const newChains = filters.blockchains.includes(chain)
      ? filters.blockchains.filter(c => c !== chain)
      : [...filters.blockchains, chain];
    updateFilters({ blockchains: newChains });
  };

  const toggleLanguage = (lang: string) => {
    const newLangs = filters.languages.includes(lang)
      ? filters.languages.filter(l => l !== lang)
      : [...filters.languages, lang];
    updateFilters({ languages: newLangs });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="glass rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">🔍 Advanced Filters</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="text-sm text-white/60 hover:text-accent transition"
          >
            Reset All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/60 hover:text-white transition"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Activity Filter */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              📊 Activity
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All", icon: "🌐" },
                { value: "hot", label: "Hot (< 7d)", icon: "🔥" },
                { value: "active", label: "Active (< 30d)", icon: "⚡" },
                { value: "quiet", label: "Quiet (30d+)", icon: "😴" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ activity: option.value as any })}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    ${
                      filters.activity === option.value
                        ? "bg-gradient-to-r from-accent to-accent/80 text-black"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }
                  `}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blockchain Filter */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              ⛓️ Blockchain
            </label>
            <div className="flex flex-wrap gap-2">
              {["solana", "ethereum", "base", "polygon", "cosmos", "bitcoin"].map((chain) => (
                <button
                  key={chain}
                  onClick={() => toggleBlockchain(chain)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
                    ${
                      filters.blockchains.includes(chain)
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }
                  `}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              💻 Language
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "Rust", icon: "🦀" },
                { value: "Solidity", icon: "⚡" },
                { value: "TypeScript", icon: "📘" },
                { value: "Python", icon: "🐍" },
                { value: "JavaScript", icon: "💛" },
                { value: "Go", icon: "🐹" }
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => toggleLanguage(lang.value)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    ${
                      filters.languages.includes(lang.value)
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }
                  `}
                >
                  {lang.icon} {lang.value}
                </button>
              ))}
            </div>
          </div>

          {/* Star Range */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              ⭐ Stars
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All Stars" },
                { value: "0-50", label: "0-50 (Very Early)" },
                { value: "50-200", label: "50-200 (Early)" },
                { value: "200-1000", label: "200-1K (Growing)" },
                { value: "1000+", label: "1K+ (Proven)" }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => updateFilters({ starRange: range.value as any })}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    ${
                      filters.starRange === range.value
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Signals */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              ✅ Quality Signals
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasTests}
                  onChange={(e) => updateFilters({ hasTests: e.target.checked })}
                  className="w-5 h-5 rounded accent-accent"
                />
                <span className="text-sm">Has Tests</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasCI}
                  onChange={(e) => updateFilters({ hasCI: e.target.checked })}
                  className="w-5 h-5 rounded accent-accent"
                />
                <span className="text-sm">Has CI/CD</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasLicense}
                  onChange={(e) => updateFilters({ hasLicense: e.target.checked })}
                  className="w-5 h-5 rounded accent-accent"
                />
                <span className="text-sm">Has License</span>
              </label>
            </div>
          </div>

          {/* Special Signals */}
          <div>
            <label className="text-sm font-semibold text-white/80 mb-3 block">
              💎 Discovery Signals
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-transparent hover:from-accent/20 transition cursor-pointer border border-accent/30">
                <input
                  type="checkbox"
                  checked={filters.showUnderrated}
                  onChange={(e) => updateFilters({ showUnderrated: e.target.checked })}
                  className="w-5 h-5 rounded accent-accent"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold">💎 Hidden Gems</div>
                  <div className="text-xs text-white/50">High quality, low stars</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent hover:from-purple-500/20 transition cursor-pointer border border-purple-500/30">
                <input
                  type="checkbox"
                  checked={filters.showEarlyStage}
                  onChange={(e) => updateFilters({ showEarlyStage: e.target.checked })}
                  className="w-5 h-5 rounded accent-accent"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold">🚀 Early Stage</div>
                  <div className="text-xs text-white/50">Created within 90 days</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}