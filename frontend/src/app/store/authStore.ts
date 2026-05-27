import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

/** Set a simple session cookie readable by Next.js middleware */
function setSessionCookie(active: boolean) {
  if (typeof document === 'undefined') return;
  if (active) {
    document.cookie = 'vibeguard_session=true; path=/; max-age=604800; SameSite=Lax';
  } else {
    document.cookie = 'vibeguard_session=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        setSessionCookie(true);
        set({ user, accessToken, refreshToken });
      },
      updateAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => {
        setSessionCookie(false);
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'vibeguard-auth',
    },
  ),
);
