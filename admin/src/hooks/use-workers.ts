"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedWorkers, Worker } from "@/types/worker";

export interface WorkerFilters {
  page?: number;
  limit?: number;
  search?: string;
  skill?: string;
  location?: string;
  verificationStatus?: string;
  availability?: string;
}

export function useWorkers(filters: WorkerFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  return useQuery({
    queryKey: ["workers", filters],
    queryFn: () => api.get<PaginatedWorkers>(`/workers?${params.toString()}`),
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ["worker", id],
    queryFn: () => api.get<Worker>(`/workers/${id}`),
    enabled: Boolean(id),
  });
}
