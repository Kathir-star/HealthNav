import { useState, useEffect } from 'react';
import { authService, DEFAULT_GUEST_USER } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { HealthProfile } from '../types';

export const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  uid: DEFAULT_GUEST_USER.id,
  email: DEFAULT_GUEST_USER.email,
  displayName: DEFAULT_GUEST_USER.user_metadata.display_name,
  onboardingCompleted: true,
  termsAccepted: true,
  profile: {
    age: 28,
    weight: 70,
    gender: 'male',
  },
  health: {
    conditions: ['None reported'],
    allergies: ['None known'],
  },
  pregnancy: {
    status: 'not_pregnant',
  },
  history: {
    medicines: ['Paracetamol 500mg (SOS)'],
    scans: [],
  },
  emergency: {
    contacts: [
      {
        name: 'Emergency Response Contact',
        phone: '+91 98765 43210',
        relationship: 'Primary Contact',
      },
    ],
  },
};

export function useProfile() {
  const [profile, setProfile] = useState<HealthProfile>(DEFAULT_HEALTH_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user && user.id !== DEFAULT_GUEST_USER.id) {
        try {
          const data = await databaseService.getProfile(user.id);
          if (data) {
            setProfile(data as unknown as HealthProfile);
          }
          setLoading(false);

          const profileSub = await databaseService.subscribeToProfile(user.id, (payload) => {
            if (payload?.new) {
              setProfile(payload.new as unknown as HealthProfile);
            }
          });

          return () => profileSub.unsubscribe();
        } catch (err) {
          console.error("Profile fetch error:", err);
          setError(err as Error);
          setLoading(false);
        }
      } else {
        setProfile(DEFAULT_HEALTH_PROFILE);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  return { profile, loading, error };
}

