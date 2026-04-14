#!/usr/bin/env node
import "./load-env.mjs";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

import { searchX }      from "./sources/x-search.mjs";
import { searchNote }   from "./sources/note-search.mjs";
import { searchGitHub } from "./sources/github-search.mjs";
import { fetchRSS }     from "./sources/rss-fetch.mjs";
import { fetchReddit }  from "./sources/reddit-fetch.mjs";
import { analyze }      from "./analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR  = path.join(__dirname, "output");
const CONFIGS_DIR = path.join(__dirname, "configs");
fs.mkdirSync(OUTPUT_DIR,  { recursive: true });
fs.mkdirSync(CONFIGS_DIR, { recursive: true });

const ALL_SOURCES = ["x", "note", "github", "rss", "reddit"];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9ぁ-んァ-ン一-龯]/g, "-").slice(0, 40);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// リサーチ実行
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function runResearch(config) {
  const { purpose, sources, queries, analysis } = config;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  SNS Research Agent`);
  console.log(`  目的：${purpose}`);
  console.log(`  ソース：${sources.join(", ")}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const data = {};

  if (sources.includes("x") && queries.x?.length > 0) {
    process.stdout.write("[x] X検索中...");
    data.x = await searchX(queries.x, 20);
    console.log(` ${data.x.length}件取得`);
  }

  if (sources.includes("note") && queries.note?.length > 0) {
    process.stdout.write("[note] note検索中...");
    data.note = await searchNote(queries.note, 30);
    console.log(` ${data.note.length}件取得`);
  }

  if (sources.includes("github") && queries.github?.length > 0) {
    process.stdout.write("[github] GitHub検索中...");
    data.github = await searchGitHub(queries.github);
    console.log(` ${data.github.length}件取得`);
  }

  if (sources.includes("rss") && queries.rss?.length > 0) {
    process.stdout.write("[rss] RSSフィード取得中...");
    data.rss = await fetchRSS(queries.rss);
    console.log(` ${data.rss.length}件取得`);
  }

  if (sources.includes("reddit") && queries.reddit?.length > 0) {
    process.stdout.write("[reddit] Reddit取得中...");
    data.reddit = await fetchReddit(queries.reddit);
    console.log(` ${data.reddit.length}件取得`);
  }

  console.log("\n分析中...");
  const report = await analyze(data, analysis?.focus ?? [], purpose);

  const filename = `research-${today()}-${sanitize(purpose)}.md`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, report, "utf-8");

  console.log(`\n✅ 完了 → ${outputPath}`);
  return { report, outputPath };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// インタラクティブモード
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SNS Research Agent — インタラクティブモード");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. 目的入力
  const purpose = (await ask(rl, "1. リサーチの目的を入力してください：\n> ")).trim();
  if (!purpose) { console.log("目的が入力されていません。終了します。"); rl.close(); return; }

  // 2. ソース選択
  console.log(`\n2. 調査ソースを選択してください（カンマ区切り、例：x,note,reddit）`);
  console.log(`   選択肢：${ALL_SOURCES.join(" / ")}`);
  const sourcesInput = (await ask(rl, "> ")).trim();
  const sources = sourcesInput
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALL_SOURCES.includes(s));

  if (sources.length === 0) {
    console.log("有効なソースが選択されていません。終了します。");
    rl.close();
    return;
  }

  // 3. キーワード入力（ソースごと）
  const queries = {};
  for (const source of sources) {
    const label = source === "rss" ? "RSS フィードURL" : source === "reddit" ? "サブレディット名（例：r/ClaudeAI）" : "検索キーワード";
    const input = (await ask(rl, `\n3-${source}. [${source}] ${label}（カンマ区切り）：\n> `)).trim();
    queries[source] = input.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // 4. 分析観点（任意）
  const focusInput = (await ask(rl, "\n4. 分析の観点があれば入力してください（カンマ区切り、省略可）：\n> ")).trim();
  const focus = focusInput ? focusInput.split(",").map((s) => s.trim()).filter(Boolean) : [];

  rl.close();

  // 設定構築
  const config = {
    purpose,
    sources,
    queries,
    analysis: { focus, output: "markdown" },
  };

  // 5. リサーチ実行
  const { outputPath } = await runResearch(config);

  // 6. 設定保存確認
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const save = (await ask(rl2, "\nこの設定を保存しますか？ (y/n)：")).trim().toLowerCase();
  rl2.close();

  if (save === "y") {
    const configName = `${today()}-${sanitize(purpose)}.json`;
    const configPath = path.join(CONFIGS_DIR, configName);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log(`✅ 設定を保存しました → ${configPath}`);
  }

  console.log("\n完了。");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メイン処理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY が設定されていません。.env を確認してください。");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const configIdx = args.indexOf("--config");

  if (configIdx !== -1 && args[configIdx + 1]) {
    // 設定ファイルモード
    const configPath = path.resolve(args[configIdx + 1]);
    if (!fs.existsSync(configPath)) {
      console.error(`❌ 設定ファイルが見つかりません: ${configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    await runResearch(config);
  } else {
    // インタラクティブモード
    await interactiveMode();
  }
}

main().catch((err) => {
  console.error("\n❌ エラー:", err.message);
  process.exit(1);
});
