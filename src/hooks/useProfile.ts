import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { HealthProfile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        try {
          // Initial fetch
          const data = await databaseService.getProfile(user.id);
          setProfile(data as unknown as HealthProfile);
          setLoading(false);

          // Real-time subscription for profile updates
          const profileSub = await databaseService.subscribeToProfile(user.id, (payload) => {
            setProfile(payload.new as unknown as HealthProfile);
          });

          return () => profileSub.unsubscribe();
        } catch (err) {
          console.error("Profile fetch error:", err);
          setError(err as Error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, loading, error };
}
