import { create } from 'zustand';

import { WorkerSummary, WorkerUser, logoutWorker } from '@/api/auth';

interface AuthState {
  accessToken: string | null;
  user: WorkerUser | null;
  worker: WorkerSummary | null;
  setSession: (accessToken: string, user: WorkerUser, worker?: WorkerSummary) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  worker: null,
  setSession: (accessToken, user, worker) => set({ accessToken, user, worker: worker ?? null }),
  clearSession: () => {
    logoutWorker();
    set({ accessToken: null, user: null, worker: null });
  },
}));
