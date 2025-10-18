import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { UserDoc } from "@myorg/shared/types";
import { db, useAuth } from "@myorg/shared";

interface CurrentUserProfileState {
  profile: UserDoc | null;
  loading: boolean;
  error: Error | null;
}

export function useCurrentUserProfile(): CurrentUserProfileState {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserDoc;
          setProfile({ ...data, uid: data.uid ?? user.uid });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (snapshotError) => {
        const err = snapshotError instanceof Error ? snapshotError : new Error("Failed to fetch user profile");
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  return { profile, loading, error };
}

