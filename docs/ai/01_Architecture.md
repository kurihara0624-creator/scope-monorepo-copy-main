アプリケーション全体仕様（AI開発用コンテキスト - 2025年版）
1. 概要
Scope Monorepo（以下、scope-monorepo）は、1on1 セッションの準備・実施・振り返りを支援する Web アプリケーションであり、PoC フェーズの検証環境として運用している。2025年10月時点の主要スタックと運用方針は以下の通り。

技術スタック（抜粋）
- 構成: Yarn Workspaces を活用したモノレポ構成
- フロントエンド: React 18 + Vite + TypeScript 5（strict）+ Tailwind CSS/PostCSS
- ルーティング: React Router 6
- バックエンド/BaaS: Firebase Authentication, Cloud Firestore
- ホスティング: Netlify（main ブランチ自動デプロイ）
- アイコン/ユーティリティ: lucide-react, react-speech-recognition, mermaid など
- AI 連携: @google/generative-ai（Gemini 系モデル）

開発運用
- Cursor（Codex CLI）を用いた「抜け漏れを減らすマスタープロンプト」方式でのタスクドリブン開発を採用。差分生成・レビュー工程は Codex CLI を経由し、Pull Request ベースで管理する。
- PoC 中は Firebase Security Rules を最小限の制約に留め、Completed セッションの上書き防止などクリティカルな制約のみを適用。将来拡張は TODO 管理とする（詳細は第4章）。

アプリケーション全体構成図（概念図）
```mermaid
flowchart LR
    subgraph Client[Web Client (React 18 + Tailwind)]
        Dashboard[DashboardPage\nActive/Completed Tab]
        OneOnOne[OneOnOnePage\nMindmapSection]
        Shared[Shared Components & Hooks]
    end
    subgraph Firebase[Firebase]
        Auth[Authentication]
        Firestore[(Cloud Firestore)]
    end
    subgraph External[External Services]
        Gemini[(Gemini API)]
    end

    Client --> Auth
    Client --> Firestore
    OneOnOne --> Gemini
    Firestore -->|Subscriptions| Dashboard
```

2. ディレクトリ構造とパッケージ間連携
scope-monorepo/package.json の workspaces 設定および tsconfig.base.json の paths 設定に基づき、以下の構造と連携ルールを採用する。

```
scope-monorepo/
├── docs/                     # 設計書・運用ドキュメント
├── packages/
│   └── shared/               # 共有ライブラリ（@myorg/shared）
│       ├── src/
│       │   ├── api/          # Firebase SDK ラッパー
│       │   ├── components/   # 再利用 UI
│       │   ├── hooks/        # 共通 Hooks
│       │   └── types/        # 型定義
│       └── package.json
├── web-app/                  # メイン SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── shared/           # ページ固有のユーティリティ
│   │   └── main.tsx 等
│   └── package.json
├── package.json
└── tsconfig.base.json
```

連携ルール
- `@myorg/shared/*` エイリアスで packages/shared のモジュールにアクセスする。
- 共有ロジック・型・UI は shared に集約し、web-app から利用する。
- Firebase へのアクセスは `@myorg/shared/api/firebase` を通じて統一する。

3. 画面一覧とルーティング（App.tsxより）
認証ガード（PrivateRoute）により、未認証ユーザーは `/login` にリダイレクトされる。2025年版の主要ルートは以下。

| パス | コンポーネント | 認証 | 概要 |
| --- | --- | --- | --- |
| `/login` | `LoginPage.tsx` | 不要 | Google Auth ベースのログイン画面。 |
| `/` | `DashboardPage.tsx` | 必須 | 1on1 セッション一覧と Active / Completed タブ、開始動線、SessionHistory を提供。 |
| `/1on1/new` | `OneOnOnePage.tsx` | 必須 | 新規 1on1 セッションのセットアップ（MindmapSection 初期化）。 |
| `/1on1/:id` | `OneOnOnePage.tsx` | 必須 | 既存セッションの閲覧・編集。status に応じて UI 制御（completed は読み取り専用）。 |
| `/settings/profile` | `SettingsProfile.tsx` | 必須 | プロフィール編集。 |
| `/admin/team-requests` | `AdminTeamRequests.tsx` | 必須（管理者） | チーム変更申請管理。 |

ルーティングは `web-app/src/App.tsx` と `components/AppLayout.tsx` で実装し、レイアウト／ナビゲーションを共通化する。Dashboard では Firestore のリアルタイム購読を利用し、Active/Completed を単一購読で分岐して表示する。Completed タブでは SessionHistory 以外の開始動線を非表示とし、Completed セッションからの再開を抑止する。

4. データモデル（Firestore コレクション構造）
PoC 時点で採用している主要ドキュメント構造は以下。Timestamp は Firebase 提供の型を利用。

#### users コレクション
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `uid` | string | Firebase Authentication UID（ドキュメント ID と一致）。 |
| `displayName` | string \| null | 表示名。 |
| `email` | string \| null | メールアドレス。 |
| `photoURL` | string \| null | プロフィール画像 URL。 |
| `lastLoginAt` | Timestamp | 最終ログイン時刻。 |
| `teamId` | string \| null | 所属チーム ID（PoC では任意）。 |

#### one-on-ones コレクション
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | string | ドキュメント ID。 |
| `sessionId` | string | UI で参照するセッション ID（ドキュメント ID と同値）。 |
| `status` | `"active"` \| `"completed"` | セッション状態。Completed は読み取り専用。 |
| `managerId`, `managerName`, `managerPhotoURL` | string | マネージャー情報。 |
| `memberId`, `memberName` | string | メンバー情報（PoC では ID が空のケースあり）。 |
| `createdAt` | Timestamp | 作成日時。 |
| `agenda`, `transcript`, `summaryPoints`, `summaryNextActions`, `reflection`, `positiveMemo` | 任意フィールド | 1on1 の内容。 |
| `mindmapText`, `mindmap` | string / JSON | Mermaid mindmap 描画用データ。 |
| `checkin` | { mood: number, focus: number } | セッション開始時のチェックイン値。 |

PoC Security Rules（`web-app/firestore.rules` 抜粋）
```
match /one-on-ones/{oneOnOneId} {
  allow read: if isSignedIn() && (resource.data.managerId == request.auth.uid || resource.data.memberId == request.auth.uid);
  allow update, delete: if isSignedIn()
    && (resource.data.managerId == request.auth.uid || resource.data.memberId == request.auth.uid)
    && resource.data.status != 'completed';
  allow create: if isSignedIn();
}
```

> TODO: チーム単位でのアクセス制御（同一 teamId のみ閲覧可）や監査ログ要件を踏まえたルール拡張を検討する。

5. API 仕様（Firebase 連携）
`packages/shared/src/api/firebase.ts` が Firebase SDK を初期化し、以下の関数・参照をエクスポートする。

- `auth`, `googleProvider`: Firebase Authentication 用ラッパー。
- `db`, `oneOnOnesCollection`, `usersCollection`: Firestore 参照。
- `addDoc`, `setDoc`, `onSnapshot` などのユーティリティ関数を再エクスポートし、web-app 側からのインポートを一本化。
- Netlify にデプロイされた環境でも、`.env` に格納した Firebase 設定を Vite 経由で注入。

Firestore との通信は以下のパターンに整理される。
1. DashboardPage: `onSnapshot(oneOnOnesCollection, …)` によりマネージャー視点のセッションを取得し、`status` で Active/Completed を分岐。
2. OneOnOnePage: セッション単体を購読し、UI ステータス（編集可否）を `status` で制御。
3. MindmapSection: `setDoc`（merge）で AI 生成結果を保存。Completed 状態ではサーバールール／クライアント双方で保存を抑止。

6. 主要な共通ロジック
- 認証（`useAuth.tsx`）: AuthProvider がアプリ全体にユーザー情報を供給。Google アカウントでのログイン、プロフィール同期、チーム ID の設定を担う。
- セッション管理（`useTeamMembers`, Dashboard フック群）: Firestore からの購読結果を正規化し、Active/Completed タブで再利用。
- Mindmap 生成: `MindmapSection` が Gemini API を呼び出し、Mermaid mindmap を生成。`MindmapDisplay` が SVG 化して表示。
- プロンプト運用: 「抜け漏れを減らすマスタープロンプト」をベースに、タスク開始時に「把握計画→実装計画→疑問点→差分適用」の手順を Codex CLI 上で実施。レビューコメントや TODO は Markdown に明示する。

7. TypeScript 設定（tsconfig.base.json）
- `"target": "ESNext"`, `"module": "ESNext"`, `"moduleResolution": "bundler"` を採用し、Vite の最適化に合わせる。
- `"jsx": "react-jsx"` により新しい JSX トランスフォームを使用。
- `"strict": true` をベースに、null 安全性を確保。
- `"paths": { "@myorg/shared/*": ["packages/shared/src/*"] }` を設定し、共有モジュールへのアクセスを簡略化。
- 補助設定: `"types": ["vite/client"]` など Vite 依存を含む型定義を読み込む。

補足
- Tailwind/PostCSS の設定は `web-app/postcss.config.cjs`, `tailwind.config.cjs` に集約。コンポーネントレベルでは `@myorg/shared` の共通スタイルと併用する。
- Netlify デプロイは `netlify.toml` にてビルドコマンド `yarn build`、出力先 `web-app/dist` を指定。Firebase API Key 等は Netlify 環境変数で管理する。
