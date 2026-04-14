import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * X（Twitter）検索
 * @param {string[]} queries - 検索クエリの配列
 * @param {number} limit - 1クエリあたりの取得件数
 * @returns {{ text: string, likes: number, retweets: number, url: string }[]}
 */
export async function searchX(queries, limit = 20) {
  const results = [];

  for (const query of queries) {
    try {
      const { stdout } = await execAsync(
        `twitter search "${query.replace(/"/g, '\\"')}" -n ${limit} --json`
      );
      const parsed = parseXOutput(stdout, query);
      results.push(...parsed);
    } catch (err) {
      console.error(`  [x-search] クエリ "${query}" 失敗: ${err.message}`);
    }
  }

  return results;
}

function parseXOutput(stdout, query) {
  const items = [];
  try {
    const json = JSON.parse(stdout);
    // twitter-cli --json の出力形式: { ok: true, schema_version: "1", data: [...] }
    const arr = Array.isArray(json) ? json : json.data ?? json.results ?? [];
    for (const item of arr) {
      const screenName = item.author?.screenName ?? "";
      const id = item.id ?? "";
      items.push({
        text:     item.text ?? "",
        likes:    item.metrics?.likes    ?? 0,
        retweets: item.metrics?.retweets ?? 0,
        url:      screenName && id
                    ? `https://x.com/${screenName}/status/${id}`
                    : `https://x.com/i/web/status/${id}`,
        query,
      });
    }
  } catch {
    // テキスト形式のフォールバック
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 20) {
        items.push({ text: trimmed, likes: 0, retweets: 0, url: "", query });
      }
    }
  }
  return items;
}
