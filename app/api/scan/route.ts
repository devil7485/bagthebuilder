import { fetchRepos } from "@/lib/github";
import {
  scoreRepo,
  inferCategories,
  isEnterpriseRepo,
  isJunkRepo,
  generateCoinReason,
  generateCoinThesis
} from "@/lib/scorer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerFilter = searchParams.get("owner");

  const repos = await fetchRepos();

  const curated = repos
    .filter((repo: any) => {
      // 👤 Individual only
      if (repo.owner.type !== "User") return false;

      // 🚫 Enterprise / orgs
      if (isEnterpriseRepo(repo)) return false;

      // 🚫 Junk / toy repos
      if (isJunkRepo(repo)) return false;

      // 📝 Must have description
      if (!repo.description || repo.description.length < 30) return false;

      // 🕒 Must be active within 6 months
      const updated = new Date(repo.updated_at).getTime();
      const sixMonths = 1000 * 60 * 60 * 24 * 180;
      if (Date.now() - updated > sixMonths) return false;

      return true;
    })
    .map((repo: any) => {
      const score = scoreRepo(repo);
      const categories = inferCategories(repo);

      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        owner: repo.owner.login,
        categories,
        score,
        earlyStage: score < 80,
        coinReason: generateCoinReason(repo),
        coin: generateCoinThesis(repo),
        goodProject: score >= 45
      };
    })
    .filter((repo) => repo.goodProject)
    .filter((repo) =>
      ownerFilter ? repo.owner === ownerFilter : true
    );

  return Response.json(curated);
}
