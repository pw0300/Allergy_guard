
import { UserProfile, IntoleranceLevel } from '../types';

const STORAGE_KEY = 'allergy_guard_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  intolerances: [],
  health: {
    condition: 'none',
    preference: 'balanced'
  },
  isOnboarded: false,
  history: []
};

export const getProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
  } catch (e) {
    console.error("Failed to load profile", e);
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
};

export const clearProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
