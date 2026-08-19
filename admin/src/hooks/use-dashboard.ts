"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  DashboardResponse,
} from "@/types/dashboard";

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard"],

    queryFn: async () => {
      const response = await fetch(
        "/api/dashboard",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load dashboard",
        );
      }

      return data;
    },

    staleTime: 30_000,

    retry: 1,

    refetchOnWindowFocus: false,
  });
}