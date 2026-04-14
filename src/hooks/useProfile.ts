import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { HealthProfile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let profileSub: { unsubscribe: () => void } | null = null;

    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        try {
          setLoading(true);
          const data = await databaseService.getProfile(user.id);
          setProfile(data as unknown as HealthProfile);
          setLoading(false);

          if (profileSub) {
            (profileSub as any).unsubscribe();
          }
          
          profileSub = await databaseService.subscribeToProfile(user.id, (payload) => {
            setProfile(payload.new as unknown as HealthProfile);
          });
        } catch (err) {
          console.error("Profile fetch error:", err);
          setError(err as Error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
        if (profileSub) {
          (profileSub as any).unsubscribe();
          profileSub = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileSub) (profileSub as any).unsubscribe();
    };
  }, []);

  return { profile, loading, error };
}
