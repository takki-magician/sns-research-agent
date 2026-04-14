import "./load-env.mjs";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * 収集データを分析してMarkdownレポートを生成する
 * @param {{ x, note, github, rss, reddit }} data - 各ソースの収集結果
 * @param {string[]} focus - 分析の観点（省略時は汎用市場分析）
 * @param {string} purpose - リサーチ目的
 * @returns {string} Markdownレポート
 */
export async function analyze(data, focus = [], purpose = "") {
  const sections = buildDataContext(data);
  const focusNote = focus.length > 0
    ? `\n## 分析の観点\n${focus.map((f) => `- ${f}`).join("\n")}`
    : "\n## 分析の観点\n汎用的な市場分析（トレンド・ニーズ・競合・機会）";

  const today = new Date().toISOString().split("T")[0];

  const prompt = `あなたは市場リサーチアナリストです。
以下の収集データを分析して、Markdownレポートを生成してください。

## ハルのポジションと制約
- キャラクター：30代・元社会不適合者がAIで人生を立て直したADHD当事者「ハル」
- ポジション：「壊れた脳の設計者」
- コア信念：脳は壊れていない、取扱説明書がなかっただけ／AIはADHDの脳が初めて対等に戦えるツール／意志力より構造的変化が有効
- ターゲット：ADHDで生きづらさを感じてる20〜40代
- やらないこと：根拠なき背中押し／ADHDの美化／精神論／「自分を好きになれ」系
- 推奨アクションはハルがXとnoteで実行できる投稿・記事のアイデアのみ
- 貯金テンプレ・動画制作・クイズツール開発などハルの活動範囲外の提案は禁止

## リサーチ目的
${purpose || "（目的未指定 — 汎用分析）"}
${focusNote}

---
${sections}
---

## 出力形式（厳守）

# リサーチレポート：${purpose || "汎用調査"} (${today})

## サマリー
3〜5行で今回のリサーチの要点をまとめる。

## 主要トレンド
データから読み取れるトレンドを3〜5つ。根拠となるデータを必ず添える。

## 注目コンテンツ
各ソースで特に反応が高かったもの上位3件ずつ（あるソースのみ）。

## 市場の穴（機会）
競合が扱っていないのにニーズがある領域を2〜3つ。

## 推奨アクション
今すぐ動けるレベルの具体的なアクション3つ。

## データ補足
収集データの限界・注意点。

---
制約：
- 「様々な」「重要です」「大切です」等のAI臭い表現禁止
- 具体的な数字・固有名詞を必ず使う
- 抽象論不要。すぐ動けるレベルの具体性で`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return res.content[0].text;
}

function buildDataContext(data) {
  const parts = [];

  if (data.x?.length > 0) {
    parts.push(`## X（Twitter）収集データ（${data.x.length}件）`);
    const top = data.x.sort((a, b) => (b.likes + b.retweets * 2) - (a.likes + a.retweets * 2)).slice(0, 20);
    parts.push(top.map((t) => `- [いいね:${t.likes} RT:${t.retweets}] ${t.text.slice(0, 100)}`).join("\n"));
  }

  if (data.note?.length > 0) {
    parts.push(`\n## note収集データ（${data.note.length}件）`);
    const top = data.note.sort((a, b) => b.likes - a.likes).slice(0, 20);
    parts.push(top.map((n) => `- 「${n.title}」 スキ:${n.likes} 価格:${n.price > 0 ? `¥${n.price}` : "無料"} by @${n.author}`).join("\n"));
  }

  if (data.github?.length > 0) {
    parts.push(`\n## GitHub収集データ（${data.github.length}件）`);
    const top = data.github.sort((a, b) => b.stars - a.stars).slice(0, 15);
    parts.push(top.map((g) => `- ${g.name} ★${g.stars} — ${g.description}`).join("\n"));
  }

  if (data.rss?.length > 0) {
    parts.push(`\n## RSS収集データ（${data.rss.length}件）`);
    parts.push(data.rss.slice(0, 15).map((r) => `- [${r.date}] ${r.title}\n  ${r.summary.slice(0, 100)}`).join("\n"));
  }

  if (data.reddit?.length > 0) {
    parts.push(`\n## Reddit収集データ（${data.reddit.length}件）`);
    const top = data.reddit.sort((a, b) => b.score - a.score).slice(0, 15);
    parts.push(top.map((r) => `- [r/${r.subreddit} score:${r.score} comments:${r.comments}] ${r.title}\n  ${r.summary.slice(0, 100)}`).join("\n"));
  }

  return parts.length > 0 ? parts.join("\n") : "（収集データなし）";
}
