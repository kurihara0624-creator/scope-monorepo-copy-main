import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { serverTimestamp, getDoc } from "firebase/firestore";
import { auth, googleProvider, db, doc, setDoc } from "../api/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setTeamIdForSelf: (teamId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function writeWithRetry(task: () => Promise<void>, retries = 3, baseDelayMs = 200) {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    try {
      await task();
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= retries) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
  throw lastError ?? new Error("Unknown write failure");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserProfileInFirestore = useCallback(async (firebaseUser: User) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    await writeWithRetry(() =>
      setDoc(
        userDocRef,
        {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await updateUserProfileInFirestore(currentUser);
        } catch (error) {
          console.error("Failed to sync user profile", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [updateUserProfileInFirestore]);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const loggedInUser = result.user;
    if (loggedInUser) {
      await updateUserProfileInFirestore(loggedInUser);
    }
  }, [updateUserProfileInFirestore]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const setTeamIdForSelf = useCallback(async (teamId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be signed in");
    }
    if (!teamId) {
      throw new Error("teamId must be provided");
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const snapshot = await getDoc(userDocRef);
    const existingTeamId = snapshot.exists() ? snapshot.data()?.teamId : undefined;

    if (existingTeamId != null) {
      throw new Error("teamId is already set");
    }

    await writeWithRetry(() =>
      setDoc(
        userDocRef,
        {
          teamId,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, loginWithGoogle, logout, setTeamIdForSelf }),
    [user, loading, loginWithGoogle, logout, setTeamIdForSelf]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}



