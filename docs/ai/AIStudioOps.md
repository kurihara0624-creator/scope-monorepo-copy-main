## AI Studio 無料キー運用ガイド

このドキュメントは、Gemini を Google Cloud から Google AI Studio 無料キーへ切り替えた後の
運用フローをまとめたものです。`netlify/functions/gemini-proxy` を経由してサーバ側で API を呼び出す構成を前提にしています。

---

### 1. 必須環境変数

| 変数名 | 設定場所 | 例 | 説明 |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Netlify Dashboard > Site settings > Build & deploy > Environment | `AIzaSy...` | **必須**。AI Studio で発行したサーバー用キー。発行後すぐに HTTP リファラーやアプリ制限を設定し、旧キーは無効化する。 |
| `GEMINI_MODEL_OVERRIDE` | Netlify 環境変数（任意） | `models/gemini-2.5-flash,models/gemini-1.5-flash` | カンマ区切りで優先するモデルを上書き。未設定時は `gemini-2.5-flash` → `gemini-1.5-flash` の順でフォールバック。 |
| `VITE_GEMINI_PROXY_ENDPOINT` | ローカル `.env`（必要に応じて） | `http://localhost:8888/.netlify/functions/gemini-proxy` | `netlify dev` 以外で開発する場合のプロキシURL。未設定時は `/.netlify/functions/gemini-proxy` を利用。 |

> **Note:** 旧来の `VITE_GEMINI_API_KEY` は不要です。フロントエンドから直接キーを参照しないよう削除してください。

---

### 2. デプロイ前チェックリスト

1. **APIキー発行・制限設定**
   - AI Studioで新キーを発行 → 直後に HTTP リファラー/アプリ制限を設定。
   - 旧キーは速やかに revoke。
2. **Netlify 環境変数更新**
   - `GEMINI_API_KEY` を新しい値に置き換え、必要に応じて `GEMINI_MODEL_OVERRIDE` も更新。
   - `netlify.toml` により Functions ディレクトリは `netlify/functions` に固定済み。
3. **キャッシュクリア & 再デプロイ**
   - Netlify ダッシュボードで「Clear cache and deploy site」を実行。
4. **動作確認**
   - `netlify dev` または本番サイトでマインドマップ生成を実行し、`gemini-proxy` が 200 を返すことを確認。
   - Console の `[Gemini] Mindmap generated via proxy...` ログで利用モデルと API バージョンを確認。
5. **追加ログ監視**
   - Netlify Functions のログで 403/404/429/503 が頻発していないかをチェック。

---

### 3. 障害時の対応

| ステータス | 意味・想定原因 | 推奨アクション |
| --- | --- | --- |
| 403 | APIキーが無効、または利用制限 | AI Studio でキー状態と制限設定を確認。必要に応じてキーを再発行。 |
| 404 | 指定モデル／APIバージョンが未公開 | `GEMINI_MODEL_OVERRIDE` の値と AI Studio で有効化されているモデルを確認し、`gemini-2.5-flash` が利用可能かを検証。 |
| 429 | Rate limit 超過 | 429 が継続する場合、プロンプト頻度を下げるか、ユーザーへ待機メッセージを表示（フェーズ1実装済み）。 |
| 503 | サービス側の一時的な過負荷 | リトライで復帰するケースが多い。数分待って再度テスト。 |

---

### 4. ローカル開発の注意点

- `netlify dev` を起動すると Functions が `http://localhost:8888/.netlify/functions/*` で動作するため、`.env` に `VITE_GEMINI_PROXY_ENDPOINT` を設定すると便利です。
- `yarn dev` 単体では Netlify Functions が立ち上がらないため、開発時は `netlify dev` の利用を推奨します。
- ローカル用の `GEMINI_API_KEY` を `.env` に記述する際も、Git 管理下に含めないよう注意してください。

---

### 5. 運用タスクまとめ

- [ ] 月次または四半期ごとに `GEMINI_API_KEY` をローテーション。
- [ ] リリース後 1 日目は Functions ログをウォッチし、429/403/404 の多発がないか確認。
- [ ] 新モデル（例: gemini-3.x）がリリースされた場合は `GEMINI_MODEL_OVERRIDE` に追記し、段階的に切替える。
- [ ] 利用状況に応じて AI Studio 側のクォータや請求設定を見直す。
