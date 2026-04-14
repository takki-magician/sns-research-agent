---
name: sns-research
description: SNS・GitHub・RSSを横断するリサーチを実行するスキル。X・note・Reddit・RSS・GitHubから情報収集してレポートを生成する。
triggers:
  - リサーチして
  - 調べて
  - 競合を調べて
  - トレンドを調べて
  - 市場調査して
  - 情報収集して
---

# SNSリサーチスキル

## 概要
ユーザーのリサーチ依頼をヒアリングして、sns-research-agentを実行し結果を報告するスキル。
どのプロジェクトからでも呼び出せる。

## 前提
- sns-research-agentのディレクトリを特定する（find ~ -name "sns-research-agent" -type d 2>/dev/null | head -1）
- 以降の操作はすべてそのディレクトリ内で行う

## 実行手順

### STEP 1：ヒアリング
以下を会話で確認する。
- リサーチの目的（何を知りたいか）
- 調査対象のSNS・ソース（x / note / github / rss / reddit）
- 検索キーワード（複数可）
不明な場合は質問する。

### STEP 2：sns-research-agentのディレクトリを特定
RESEARCH_DIR=$(find ~ -name "sns-research-agent" -type d 2>/dev/null | head -1)

### STEP 3：一時configを生成
$RESEARCH_DIR/configs/tmp-research.json を以下の形式で作成する。

{
  "purpose": "（ヒアリングした目的）",
  "sources": ["（選択したソース）"],
  "queries": {
    "x": ["キーワード1", "キーワード2"],
    "note": ["キーワード1"],
    "github": ["キーワード1"],
    "rss": ["https://example.com/feed.xml"],
    "reddit": ["r/subreddit1"]
  },
  "analysis": {
    "focus": ["（目的から導いた分析観点）"],
    "output": "markdown"
  }
}

選択しなかったソースのキーは含めない。

### STEP 4：実行
cd $RESEARCH_DIR
node agent.mjs --config configs/tmp-research.json

### STEP 5：結果報告
output/に生成されたレポートを読んで以下を報告する。
- 主要トレンド3つ（箇条書き）
- 市場の穴・機会（箇条書き）
- 推奨アクション（箇条書き）

詳細が必要な場合はレポートのパスを伝える。

### STEP 6：後片付け
tmp-research.jsonを削除する。

## 使用例

「競合のADHDクリエイターのX投稿トレンドを調べて」
→ ソース：x
→ キーワード：ADHD AI、ADHD Claude、発達障害 AI
→ 分析観点：伸びてる投稿の型・フック・競合のポジション

「Claude Codeの最新情報をGitHubとRedditで調べて」
→ ソース：github、reddit
→ キーワード：claude-code、Claude Code
→ reddit：r/ClaudeAI、r/LocalLLaMA
→ 分析観点：最新機能・ユーザーの反応・課題

「noteで売れてるADHD記事を調べて」
→ ソース：note
→ キーワード：ADHD、ADHD AI
→ 分析観点：売れてる記事のタイトル・価格・内容傾向

## 注意事項
- configs/tmp-research.jsonは実行後必ず削除する
- ANTHROPIC_API_KEYは.envから自動読み込み
- sns-research-agentが見つからない場合はパスを確認してユーザーに報告する
