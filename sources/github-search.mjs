import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * GitHub リポジトリ検索（gh CLI使用）
 * @param {string[]} queries - 検索クエリの配列
 * @returns {{ name: string, description: string, stars: number, url: string }[]}
 */
export async function searchGitHub(queries) {
  const results = [];

  for (const query of queries) {
    try {
      const { stdout } = await execAsync(
        `gh search repos "${query.replace(/"/g, '\\"')}" --limit 25 --json name,description,stargazerCount,url`
      );
      const parsed = parseGitHubOutput(stdout, query);
      results.push(...parsed);
    } catch (err) {
      console.error(`  [github-search] クエリ "${query}" 失敗: ${err.message}`);
    }
  }

  return results;
}

function parseGitHubOutput(stdout, query) {
  const items = [];
  try {
    const json = JSON.parse(stdout);
    const arr = Array.isArray(json) ? json : json.items ?? json.data ?? [];
    for (const item of arr) {
      items.push({
        name:        item.name        ?? "",
        description: item.description ?? "",
        stars:       item.stargazerCount ?? item.stars ?? 0,
        url:         item.url         ?? "",
        query,
      });
    }
  } catch {
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 5) {
        items.push({ name: trimmed, description: "", stars: 0, url: "", query });
      }
    }
  }
  return items;
}
