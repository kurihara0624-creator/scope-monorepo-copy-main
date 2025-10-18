// === 修正後の firebase.ts ===
console.log("All environment variables visible in firebase.ts:", import.meta.env);


import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    Timestamp,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    setDoc,
    onSnapshot, // Aさんの変更とあなたの変更を統合
    getDoc      // あなたが追加した変更
} from "firebase/firestore";

// 環境変数のデバッグ用ログ（本番環境では削除する）
console.log("Firebase Config Debug:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "設定済み" : "未設定",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "設定済み" : "未設定",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "設定済み" : "未設定",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "設定済み" : "未設定",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "設定済み" : "未設定",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "設定済み" : "未設定",
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing:", import.meta.env.VITE_FIREBASE_API_KEY);
  throw new Error("VITE_FIREBASE_API_KEY is not defined in environment variables");
}

const app = initializeApp(firebaseConfig);

// --- 主要なサービスをエクスポート ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- よく使うコレクションへの参照をエクスポート ---
export const oneOnOnesCollection = collection(db, 'one-on-ones');
export const usersCollection = collection(db, 'users');

// --- Firestoreの便利な機能をまとめてエクスポート ---
export {
    addDoc,
    Timestamp,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    setDoc,
    onSnapshot, // Aさんの変更とあなたの変更を統合
    getDoc      // あなたが追加した変更
}; 