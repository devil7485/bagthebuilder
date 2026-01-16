export type RawRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  
  owner: {
    id: number;
    login: string;
    type: string;
    avatar_url: string;
    html_url: string;
  };
  
  created_at: string;
  updated_at: string;
  pushed_at: string;
  
  language: string | null;
  topics: string[];
  
  size: number;
  has_issues: boolean;
  has_wiki: boolean;
  license: { key: string; name: string } | null;
};

export type RawUser = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
  
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  
  public_repos: number;
  followers: number;
  following: number;
  
  created_at: string;
  updated_at: string;
};

export type CommitActivity = {
  total_commits: number;
  weeks_active: number;
  avg_commits_per_week: number;
  last_commit_date: string;
  consistency_score: number; // 0-100
};

export type RepoQuality = {
  has_readme: boolean;
  has_license: boolean;
  has_tests: boolean;
  has_ci: boolean;
  documentation_quality: number; // 0-100
  code_quality_score: number; // 0-100
  maintenance_score: number; // 0-100
};

export type RepoRecord = {
  id: number;
  builder: string;
  name: string;
  full_name: string;
  description: string;
  url: string;
  
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  
  language: string | null;
  topics: string[];
  
  created_at: string;
  last_commit_at: string;
  
  categories: string[];
  quality: RepoQuality;
  activity: CommitActivity;
  
  product_score: number; // 0-100
  execution_score: number; // 0-100
  final_score: number; // 0-100
  coin_worthy: boolean;
};

export type BuilderRecord = {
  id: number;
  username: string;
  name: string | null;
  avatar: string;
  profile_url: string;
  
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  
  total_repos: number;
  quality_repos: number[]; // IDs of repos that passed filters
  focus_areas: string[]; // Primary categories
  
  followers: number;
  public_repos: number;
  
  reputation_score: number; // Aggregate score
  consistency_score: number; // How consistent their work is
  
  first_seen_at: string;
  last_active_at: string;
  last_scanned_at: string;
};

export type ScanState = {
  last_scanned_at: string;
  total_builders_found: number;
  total_repos_evaluated: number;
  scanned_users: Set<string>;
  rate_limit: {
    remaining: number;
    reset_at: number;
  };
};

export type Store = {
  builders: Record<string, BuilderRecord>;
  repos: Record<string, RepoRecord>;
  state: ScanState;
};

export type CategoryKeywords = {
  crypto: string[];
  ai: string[];
  infra: string[];
  privacy: string[];
  games: string[];
  api: string[];
  agi: string[];
  tools: string[];
};

export type EvaluationResult = {
  accepted: boolean;
  reason?: string;
  score: number;
  categories: string[];
  quality: RepoQuality;
  coinWorthy: boolean;
};