/**
 * note.com 検索
 * @param {string[]} queries - 検索クエリの配列
 * @param {number} size - 1クエリあたりの取得件数
 * @returns {{ title: string, likes: number, price: number, author: string }[]}
 */
export async function searchNote(queries, size = 30) {
  const results = [];

  for (const query of queries) {
    try {
      const url = `https://note.com/api/v3/searches?context=note&q=${encodeURIComponent(query)}&size=${size}&sort=like`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const notes = data.data?.notes?.contents ?? [];

      for (const note of notes) {
        results.push({
          title:  note.name ?? "",
          likes:  note.like_count ?? note.likeCount ?? 0,
          price:  note.price ?? 0,
          author: note.user?.urlname ?? note.user?.nickname ?? "",
          query,
        });
      }
    } catch (err) {
      console.error(`  [note-search] クエリ "${query}" 失敗: ${err.message}`);
    }
  }

  return results;
}
