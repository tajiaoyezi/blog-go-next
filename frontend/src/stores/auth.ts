import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfo {
  userId: number;
  nickname: string;
  avatar: string;
  intro: string;
  email: string;
  loginType: number;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
}

let hydrated = false;
const hydrateListeners = new Set<() => void>();

function onHydrate() {
  hydrated = true;
  hydrateListeners.forEach((l) => l());
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "blog-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (_state, error) => {
        if (!error) onHydrate();
      },
    },
  ),
);

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => {
      hydrateListeners.add(cb);
      return () => hydrateListeners.delete(cb);
    },
    () => hydrated,
    () => false,
  );
}