import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * RSS フィード取得
 * @param {string[]} urls - RSS フィード URL の配列
 * @returns {{ title: string, summary: string, url: string, date: string }[]}
 */
export async function fetchRSS(urls) {
  const results = [];

  for (const feedUrl of urls) {
    try {
      const { stdout } = await execAsync(
        `agent-reach rss "${feedUrl.replace(/"/g, '\\"')}"`
      );
      const parsed = parseRSSOutput(stdout, feedUrl);
      results.push(...parsed);
    } catch (err) {
      console.error(`  [rss-fetch] URL "${feedUrl}" 失敗: ${err.message}`);
    }
  }

  return results;
}

function parseRSSOutput(stdout, feedUrl) {
  const items = [];
  try {
    const json = JSON.parse(stdout);
    const arr = Array.isArray(json) ? json : json.items ?? json.entries ?? [];
    for (const item of arr) {
      items.push({
        title:   item.title   ?? "",
        summary: item.summary ?? item.description ?? item.content ?? "",
        url:     item.link    ?? item.url ?? feedUrl,
        date:    item.published ?? item.updated ?? item.pubDate ?? "",
        source:  feedUrl,
      });
    }
  } catch {
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 10) {
        items.push({ title: trimmed, summary: "", url: feedUrl, date: "", source: feedUrl });
      }
    }
  }
  return items;
}
