# MindmapDisplay と関連ユーティリティ

このドキュメントでは、Scope Mindmap の中核コンポーネントである `MindmapDisplay` と、Gemini 応答を Mermaid へ変換するユーティリティについて解説します。

## コンポーネントツリー

```
MindmapPage.tsx
└─ MindmapDisplay (packages/shared)
```

- `MindmapPage` がユーザー入力と Gemini へのリクエストを担い、生成された Mermaid 文字列を `MindmapDisplay` へ渡します。
- `MindmapDisplay` は表示専用で、状態管理やネットワークアクセスは行いません。

## MindmapDisplay の役割

ファイル: `packages/shared/src/components/MindmapDisplay.tsx`

- `mermaid` ライブラリを初期化し、受け取った `chart` 文字列を SVG にレンダリングします。
- レンダリングに失敗した場合は、Mermaid 構文の確認を促すエラーメッセージを DOM に直接描画します。
- `rerenderKey` を変更すると強制的に再描画が走るため、同一チャートを再評価したいケースに利用できます。

## Gemini 応答の変換フロー

```
generateMindmapFromText (packages/shared/src/utils/mindmap.ts)
    ├─ promptTemplate(): Gemini に渡す指示文を生成
    ├─ callGeminiProxy(): Netlify Functions 経由で Gemini API を呼び出し
    ├─ extractFirstJsonObject(): 応答から最初の JSON オブジェクトを抽出
    ├─ buildMermaidChart(): MindmapSchema → Mermaid `graph LR` 文字列に変換
    └─ return { chart, schema, modelName, apiVersion }
```

### MindmapSchema

```ts
export interface MindmapSchema {
  rootTopic: string;
  categories?: MindmapCategory[];
  emotions?: string[];
  actions?: string[];
}

export interface MindmapCategory {
  name: string;
  children?: MindmapCategory[];
}
```

- `rootTopic`: マインドマップの中心に配置されるテーマ。
- `categories`: 具体的な話題や出来事を表すノード階層。
- `emotions`: 会話で特に顕在化した感情・価値観。
- `actions`: 得意な行動やモチベーションの源泉を動詞で表現したもの。

### Mermaid の構造

`buildMermaidChart()` は以下のルールでノードを構成します。

- `graph LR` を基盤に、`subgraph` を使って「感情・価値観」「得意な行動」「事実とトピック」を区画化。
- 各配列の要素にはスタイルクラス（`category1Style` 〜 `category4Style`）を順番に割り当て、色分けしたノードとして描画。
- ルートトピックには `rootStyle` を適用し、視覚的に強調されるように設定。
- 空文字や null が混入している場合はスキップすることで、Mermaid の構文エラーを防止。

### エラーハンドリング

- Gemini 応答に JSON が含まれない場合は例外を投げ、呼び出し元（`MindmapPage`）でユーザー向けエラーメッセージに変換します。
- Mermaid 変換時に不正な文字が含まれた場合は `sanitize()` でダブルクォートや改行をエスケープし、最低限の安全性を確保します。

## 今後の拡張案

- `schema` をブラウザの IndexedDB に保存し、再描画用の履歴を提供する。
- Mermaid ではなく D3 や Graphviz を利用した別視覚化モードを追加する。
- `generateMindmapFromText` の返却値にトークン消費量などのメタデータを付与し、コスト監視を行う。
