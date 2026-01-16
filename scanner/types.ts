export type RawRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;

  stargazers_count: number;
  forks_count: number;

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
};

export type RepoRecord = {
  id: number;
  builder: string;
  name: string;
  description: string;
  url: string;

  stars: number;
  forks: number;
  last_commit_at: string;

  categories: string[];
  product_score: number;
  coin_worthy: boolean;
};

export type BuilderRecord = {
  id: number;
  username: string;
  avatar: string;
  profile_url: string;

  repos: number[];
  reputation_score: number;

  first_seen_at: string;
  last_active_at: string;
};
