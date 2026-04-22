import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 自分のアカウント（haru_adhd_ai）のX記事URLとタイトルを収集する
 * @param {string} username - Xのユーザー名（@なし）
 * @returns {{ title: string, url: string, postedAt: string }[]}
 */
export async function fetchOwnArticles(username = "haru_adhd_ai") {
  const results = [];

  try {
    const { stdout } = await execAsync(
      `twitter search "from:${username}" -n 50 --json`
    );

    let tweets = [];
    try {
      const json = JSON.parse(stdout);
      tweets = Array.isArray(json) ? json : json.data ?? json.results ?? [];
    } catch {
      // パース失敗は空配列で継続
    }

    for (const item of tweets) {
      const text = item.text ?? "";
      // x.com/i/articles/ URLを含むツイートだけ対象
      const articleMatch = text.match(/https?:\/\/x\.com\/i\/articles\/([a-zA-Z0-9]+)/);
      if (!articleMatch) continue;

      const url = articleMatch[0];

      // タイトルはURL直前のテキストから抽出（URL除去後の最終行）
      const textWithoutUrl = text.replace(/https?:\/\/\S+/g, "").trim();
      const lines = textWithoutUrl.split("\n").map(l => l.trim()).filter(Boolean);
      const title = lines[lines.length - 1] ?? "";

      const postedAt = item.createdAt ?? item.created_at ?? "";

      // 重複除去（同じURLが複数ツイートに含まれる場合は最初のものを採用）
      if (!results.find(r => r.url === url)) {
        results.push({ title, url, postedAt });
      }
    }
  } catch (err) {
    console.error(`  [own-articles] 取得失敗: ${err.message}`);
  }

  return results;
}
