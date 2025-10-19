# Scope Mindmap (web-app)

Scope Mindmap は、テキストを入力して Gemini に要約・構造化させ、その結果を Mermaid でマインドマップとして描画するシンプルな SPA です。Firebase や認証機能は削除されており、Gemini プロキシを通じたマインドマップ生成に特化しています。

## 主な機能

- テキストエリアに会話メモやアイデアを入力
- 「マインドマップを生成」ボタンで Netlify Functions を介して Gemini にリクエスト
- 取得した JSON を Mermaid `graph LR` 形式へ変換し、SVG として表示
- 生成中のローディング表示・エラー表示、利用モデルのログ出力

## 開発手順

```bash
# 依存関係のインストール
yarn install

# 共有パッケージの型チェック（必要に応じて）
yarn build -w packages/shared

# Netlify Functions を含めて起動
netlify dev

# もしくはフロントエンドのみ
yarn dev -w web-app
```

Netlify Functions を経由しない場合、`VITE_GEMINI_PROXY_ENDPOINT` に任意のエンドポイントを指定してください。

## ビルド

```bash
yarn build -w web-app
```

成果物は `web-app/dist` に出力され、Netlify により公開されます。Function 部分は `netlify/functions/gemini-proxy.js` を参照してください。

## 環境変数のポイント

- `GEMINI_API_KEY`: Netlify 側でのみ設定する。ブラウザから参照しない。
- `GEMINI_MODEL_OVERRIDE`: 生成に利用するモデルをカンマ区切りで指定可能。
- `VITE_GEMINI_PROXY_ENDPOINT`: ローカル開発でプロキシ URL を切り替えたい場合に使用。

詳細は `docs/ai/AIStudioOps.md` を参照してください。
