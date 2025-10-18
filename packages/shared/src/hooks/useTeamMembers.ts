import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { db, doc, getDoc, collection, query, where, getDocs } from '../api/firebase';
import type { UserDoc } from '../types';

interface UseTeamMembersResult {
  teamMembers: UserDoc[];
  isLoading: boolean;
  error: Error | null;
  requiresTeamSetup: boolean;
  profileExists: boolean;
}

export function useTeamMembers(): UseTeamMembersResult {
  const { user: currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requiresTeamSetup, setRequiresTeamSetup] = useState(false);
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    let isActive = true;

    const resetState = () => {
      if (!isActive) return;
      setTeamMembers([]);
      setRequiresTeamSetup(false);
      setProfileExists(true);
      setError(null);
    };

    if (!currentUser) {
      resetState();
      setIsLoading(false);
      setProfileExists(false);
      setRequiresTeamSetup(false);
      return () => {
        isActive = false;
      };
    }

    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      setRequiresTeamSetup(false);
      setProfileExists(true);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          if (!isActive) return;
          setTeamMembers([]);
          setProfileExists(false);
          setRequiresTeamSetup(true);
          return;
        }

        const myProfile = userDocSnap.data() as UserDoc;
        const teamId = myProfile.teamId;

        if (!teamId) {
          if (!isActive) return;
          setTeamMembers([]);
          setRequiresTeamSetup(true);
          return;
        }

        const usersRef = collection(db, 'users');
        const teamQuery = query(usersRef, where('teamId', '==', teamId));
        const querySnapshot = await getDocs(teamQuery);
        if (!isActive) return;

        const members = querySnapshot.docs
          .map((snap) => ({ ...snap.data(), uid: snap.id } as UserDoc))
          .filter((member) => member.uid !== currentUser.uid);

        setTeamMembers(members);
      } catch (err) {
        if (!isActive) return;
        console.error('Failed to load team members', err);
        setError(err instanceof Error ? err : new Error('Failed to load team members')); // fallback error
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  return { teamMembers, isLoading, error, requiresTeamSetup, profileExists };
}