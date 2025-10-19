# AI Studio 無料キー運用ガイド

Scope Mindmap では Netlify Functions（`netlify/functions/gemini-proxy.js`）を経由して Gemini API を利用します。ここでは無料枠キーを安全に運用するための手順とチェックポイントをまとめます。

---

## 1. 必須環境変数

| 変数名 | 設定対象 | 例 | 説明 |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Netlify Dashboard → Site settings → Build & deploy → Environment | `AIzaSy...` | サーバー側でのみ利用する Google AI Studio の API キー。作成直後に HTTP リファラまたはアプリ制限を必ず設定する。 |
| `GEMINI_MODEL_OVERRIDE` | Netlify 環境変数（任意） | `models/gemini-2.5-flash,models/gemini-1.5-flash` | 利用モデルの優先順位をカンマ区切りで上書き。未設定時は 2.5 → 1.5 の順でフォールバック。 |
| `VITE_GEMINI_PROXY_ENDPOINT` | `.env` などローカル限定（任意） | `http://localhost:8888/.netlify/functions/gemini-proxy` | `netlify dev` 以外で開発したい場合のフォールバック URL。未設定でも `/.netlify/functions/gemini-proxy` を参照する。 |

> **NOTE:** 旧構成で使用していた Firebase 関連の環境変数はすべて不要です。

---

## 2. デプロイ前チェックリスト

1. **API キー発行と制限設定**  
   AI Studio で新しいキーを発行した後、即座に HTTP リファラまたはアプリ制限を有効化し、旧キーは revoke する。
2. **Netlify 環境変数の更新**  
   `GEMINI_API_KEY` を新しい値に置き換え、必要に応じて `GEMINI_MODEL_OVERRIDE` も更新する。
3. **キャッシュクリア & 再デプロイ**  
   Netlify の「Clear cache and deploy site」を実行してからデプロイする。
4. **動作確認**  
   `netlify dev` または本番サイトで Mindmap を生成し、`gemini-proxy` が 200 を返すこと、ブラウザコンソールにモデル情報が出力されることを確認する。
5. **ログ監視**  
   デプロイ直後は Functions のログを確認し、429/403/404 が多発していないかチェックする。

---

## 3. エラーコード別の対処指針

| ステータス | 意味・想定原因 | 推奨アクション |
| --- | --- | --- |
| 403 | API キーが無効、または利用制限に抵触 | AI Studio のキー状態と制限設定を確認し、必要に応じて再発行。 |
| 404 | 指定モデルまたは API バージョンが未公開 | `GEMINI_MODEL_OVERRIDE` の値を見直し、公開済みモデルを指定する。 |
| 429 | Rate limit 超過 | 送信頻度を下げる、ユーザーへリトライの案内を表示する、もしくはモデルの組み合わせを再検討する。 |
| 503 | 一時的なサービス過負荷 | 数秒〜数十秒後に自動リトライ。継続する場合はステータスページを確認。 |

---

## 4. ローカル開発のコツ

- `netlify dev` を立ち上げると Functions が `http://localhost:8888/.netlify/functions/*` で動作する。`VITE_GEMINI_PROXY_ENDPOINT` を設定しておくと SPA 側のリクエストが安定する。
- `yarn dev -w web-app` 単体では Functions が起動しないため、Gemini 連携を確認したい場合は `netlify dev` を利用する。
- ローカルで `GEMINI_API_KEY` を利用する場合も、`.env` を `.gitignore` に含めるなど取り扱いに注意する。

---

## 5. 運用タスクの定期チェック

- [ ] 四半期ごとに `GEMINI_API_KEY` をローテーションし、使用していないキーを削除。  
- [ ] 新バージョンや新モデル（例: gemini-3.x）が提供されたら、検証環境で `GEMINI_MODEL_OVERRIDE` に追加して評価。  
- [ ] Functions ログで 429/403 が一定回数以上発生した場合は、利用者に告知または制限緩和を検討。  
- [ ] アプリの UI から送信するテキストに機密情報が含まれないよう定期的にレビュー。  
- [ ] Netlify 側のビルドログで API キーが誤って出力されていないか確認。  

これらを遵守することで、無料枠でも安定した Mindmap 生成体験を提供できます。
