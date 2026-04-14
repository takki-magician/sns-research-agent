# sns-research-agent
X・note・GitHub・RSS・Redditを横断する汎用リサーチエージェント

## 使い方

```bash
# 設定ファイルあり
node agent.mjs --config configs/your-config.json

# インタラクティブモード（設定ファイルなし）
node agent.mjs
```

## 設定ファイルの形式

```json
{
  "purpose": "リサーチ目的の名前",
  "sources": ["x", "note", "github", "rss", "reddit"],
  "queries": {
    "x": ["検索ワード1", "検索ワード2"],
    "note": ["検索ワード1"],
    "github": ["検索ワード1"],
    "rss": ["https://example.com/feed.xml"],
    "reddit": ["r/subreddit1"]
  },
  "analysis": {
    "focus": ["分析観点1", "分析観点2"],
    "output": "markdown"
  }
}
```

## 環境変数

`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定
```

| 変数 | 説明 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API キー |

## 依存関係のインストール

```bash
npm install
```

## 前提条件

- `agent-reach` がグローバルにインストール済みであること
- Twitter/X 機能を使う場合は `agent-reach configure twitter-cookies` で認証済みであること
