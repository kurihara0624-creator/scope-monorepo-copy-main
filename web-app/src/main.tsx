import 'regenerator-runtime/runtime' // この行を一番上に追加
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// ===================================================================
// ★★★ Netlify環境変数 デバッグコード START ★★★
// 目的：ビルド後のアプリがどの環境変数を読み込んでいるかを確認する
// ===================================================================
//console.log("--- Netlify Environment Variable Debug ---");

// 1. Viteが環境変数を認識しているか確認
//console.log("VITE_FIREBASE_API_KEY (from import.meta.env):", import.meta.env.VITE_FIREBASE_API_KEY);

// ===================================================================
// ★★★ 原因特定のためのデバッグコード START ★★★
// ===================================================================
console.log("--- Local Environment Variable Debug ---");

// Viteが認識している全ての環境変数をオブジェクトとして出力します。
// これで、.envファイルが読み込まれているかどうかが一発でわかります。
console.log("All environment variables visible to Vite:", import.meta.env);

console.log("------------------------------------------");
// ===================================================================
// ★★★ デバッグコード END ★★★
// ===================================================================




// 2. 実際にFirebaseに渡される設定オブジェクト全体を確認
const firebaseConfigForDebug = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log("Firebase Config Object (for debug):", firebaseConfigForDebug);

console.log("------------------------------------------");
// ===================================================================
// ★★★ デバッグコード END (デプロイ成功後にこのブロックは削除してください) ★★★
// ===================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
