import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Reddit サブレディット取得
 * @param {string[]} subreddits - サブレディット名の配列（"r/" プレフィックスあり・なし両対応）
 * @returns {{ title: string, score: number, comments: number, url: string, summary: string }[]}
 */
export async function fetchReddit(subreddits) {
  const results = [];

  for (const raw of subreddits) {
    const sub = raw.replace(/^r\//, "");
    try {
      const { stdout } = await execAsync(
        `agent-reach reddit "${sub.replace(/"/g, '\\"')}"`
      );
      const parsed = parseRedditOutput(stdout, sub);
      results.push(...parsed);
    } catch (err) {
      console.error(`  [reddit-fetch] r/${sub} 失敗: ${err.message}`);
    }
  }

  return results;
}

function parseRedditOutput(stdout, sub) {
  const items = [];
  try {
    const json = JSON.parse(stdout);
    // agent-reach の Reddit 出力形式に対応
    const children = json?.data?.children ?? json?.children ?? (Array.isArray(json) ? json : []);
    for (const child of children) {
      const d = child.data ?? child;
      items.push({
        title:    d.title    ?? "",
        score:    d.score    ?? d.ups ?? 0,
        comments: d.num_comments ?? d.comments ?? 0,
        url:      d.url     ?? `https://www.reddit.com${d.permalink ?? ""}`,
        summary:  (d.selftext ?? "").slice(0, 300),
        subreddit: sub,
      });
    }
  } catch {
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 10) {
        items.push({ title: trimmed, score: 0, comments: 0, url: "", summary: "", subreddit: sub });
      }
    }
  }
  return items;
}
