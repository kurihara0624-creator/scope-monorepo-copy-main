import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing");
  throw new Error("VITE_FIREBASE_API_KEY is not defined in environment variables");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const oneOnOnesCollection = collection(db, "one-on-ones");
export const usersCollection = collection(db, "users");
export const teamChangeRequestsCollection = collection(db, "teamChangeRequests");

export {
  collection,
  addDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
};
