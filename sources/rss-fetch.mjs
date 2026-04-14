/**
 * RSS フィード取得（Node.js native fetch使用・CLIなし）
 * @param {string[]} urls - RSS フィード URL の配列
 * @returns {{ title: string, summary: string, url: string, date: string }[]}
 */
export async function fetchRSS(urls) {
  const results = [];

  for (const feedUrl of urls) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; research-agent/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parseRSSXml(xml, feedUrl);
      results.push(...parsed);
    } catch (err) {
      console.error(`  [rss-fetch] URL "${feedUrl}" 失敗: ${err.message}`);
    }
  }

  return results;
}

function parseRSSXml(xml, feedUrl) {
  const items = [];
  const itemPattern = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/g;
  let m;
  while ((m = itemPattern.exec(xml)) !== null) {
    const block = m[1];
    const title   = getField(block, "title");
    const link    = getAttrHref(block) || getField(block, "link") || feedUrl;
    const summary = getField(block, "summary") || getField(block, "description") || "";
    const date    = getField(block, "pubDate") || getField(block, "published") || getField(block, "updated") || "";
    if (title) {
      items.push({
        title,
        summary: summary.slice(0, 300),
        url: link.trim(),
        date,
        source: feedUrl,
      });
    }
  }
  return items;
}

function getField(xml, tag) {
  const m = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, "i")
  );
  if (!m) return "";
  return (m[1] ?? m[2] ?? "")
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getAttrHref(block) {
  const m = block.match(/<link[^>]+href="([^"]+)"/i);
  return m ? m[1] : "";
}
