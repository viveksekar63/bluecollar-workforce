import { create } from 'zustand';

import { AuthUser, EmployerSummary, WorkerSummary, logoutWorker } from '@/api/auth';

export type MobileRole = 'WORKER' | 'EMPLOYER';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  worker: WorkerSummary | null;
  employer: EmployerSummary | null;
  activeRole: MobileRole | null;
  setSession: (accessToken: string, user: AuthUser, worker?: WorkerSummary, employer?: EmployerSummary) => void;
  updateEmployerProfile: (user: Partial<AuthUser>, employer: Partial<EmployerSummary>) => void;
  setActiveRole: (role: MobileRole) => void;
  clearSession: () => void;
}

function availableRoles(user: AuthUser): MobileRole[] {
  return (user.roles ?? []).filter((role): role is MobileRole => role === 'WORKER' || role === 'EMPLOYER');
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  worker: null,
  employer: null,
  activeRole: null,
  setSession: (accessToken, user, worker, employer) => {
    const roles = availableRoles(user);
    set({ accessToken, user, worker: worker ?? null, employer: employer ?? null, activeRole: roles.length === 1 ? roles[0] : null });
  },
  updateEmployerProfile: (user, employer) => set((state) => ({
    user: state.user ? { ...state.user, ...user } : state.user,
    employer: state.employer ? { ...state.employer, ...employer } : state.employer,
  })),
  setActiveRole: (activeRole) => set({ activeRole }),
  clearSession: () => {
    logoutWorker();
    set({ accessToken: null, user: null, worker: null, employer: null, activeRole: null });
  },
}));
