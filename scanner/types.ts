// Raw GitHub API responses
export type RawRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  archived: boolean;
};

export type RawUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  type: string;
};

// Store types
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
  quality: QualityMetrics;
  product_score: number;
  execution_score: number;
  final_score: number;
  coin_worthy: boolean;
  activity: ActivityMetrics;
  
  // 🔥 NEW FIELDS
  blockchain?: string[];
  frameworks?: string[];
  repoAgeInDays?: number;
  daysSinceLastCommit?: number;
  starVelocity?: number;
  isUnderrated?: boolean;
  isEarlyStage?: boolean;
  isActive?: boolean;
  isHot?: boolean;
};

export type QualityMetrics = {
  hasReadme: boolean;
  hasTests: boolean;
  hasCI: boolean;
  hasLicense: boolean;
};

export type ActivityMetrics = {
  total_commits: number;
  weeks_active: number;
  avg_commits_per_week: number;
  last_commit_date: string;
  consistency_score: number;
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
  quality_repos: number[];
  focus_areas: string[];
  followers: number;
  public_repos: number;
  reputation_score: number;
  consistency_score: number;
  first_seen_at: string;
  last_active_at: string;
  last_scanned_at: string;
};

export type DataStore = {
  repos: Record<number, RepoRecord>;
  builders: Record<string, BuilderRecord>;
  last_updated: string;
};