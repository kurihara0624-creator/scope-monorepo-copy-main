import { useState, useEffect, useContext, createContext, type ReactNode} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, db, doc, setDoc, Timestamp } from '../api/firebase';

// ★★★ここが修正点①★★★ logout関数の戻り値の型を追加
interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // updateUserProfileInFirestoreは、lastLoginAtを再度追加
  const updateUserProfileInFirestore = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userData = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      lastLoginAt: Timestamp.now(), // 最終ログイン日時も記録
    };
    try {
      await setDoc(userDocRef, userData, { merge: true });
      console.log("ユーザープロフィールをFirestoreに保存/更新しました。");
    } catch (error) {
      console.error("Firestoreへのプロフィール保存に失敗しました:", error);
    }
  };

  // useEffectは変更なし
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // loginWithGoogle関数も変更なし
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result.user;
      if (loggedInUser) {
        await updateUserProfileInFirestore(loggedInUser);
      }
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  // ★★★ここが修正点②★★★
  // logout関数を、より安全な非同期処理に書き換える
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("ログアウトに成功しました。");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = { user, loading, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// useAuthフックは変更なし
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 