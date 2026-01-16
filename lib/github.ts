// lib/github.ts

const PER_PAGE = 50;
const MAX_PAGES = 4; // 50 x 4 = 200 repos (SAFE)

export async function fetchRepos() {
  const query = [
    "stars:>=1",
    "fork:false",
    "archived:false"
  ].join(" ");

  const allRepos: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query
      )}&sort=updated&order=desc&per_page=${PER_PAGE}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json"
        },
        cache: "no-store"
      }
    );

    // ❗ Stop gracefully if GitHub blocks us
    if (!res.ok) {
      console.warn("GitHub API stopped at page", page);
      break;
    }

    const data = await res.json();
    if (!data.items || data.items.length === 0) break;

    allRepos.push(...data.items);
  }

  return allRepos;
}
