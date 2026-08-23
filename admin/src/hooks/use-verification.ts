"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  UpdateVerificationCheckPayload,
  UpdateVerificationStatusPayload,
  VerificationQuery,
  VerificationRequest,
  VerificationResponse,
} from "@/types/verification";

const DEFAULT_QUERY: VerificationQuery = { page: 1, limit: 20 };
const DEFAULT_META: VerificationResponse["meta"] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

function queryString(query: VerificationQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function useVerification(initialQuery: VerificationQuery = DEFAULT_QUERY) {
  const initialQueryRef = useRef(initialQuery);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = useCallback(async (query: VerificationQuery = initialQueryRef.current) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/verification${queryString(query)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await parseResponse<VerificationResponse>(response);
      setRequests(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load verification requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const getVerification = useCallback(async (id: string) => {
    const response = await fetch(`/api/verification/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseResponse<VerificationRequest>(response);
  }, []);

  const startVerification = useCallback(async (workerId: string) => {
    const response = await fetch(`/api/verification/worker/${workerId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return parseResponse<VerificationRequest>(response);
  }, []);

  const updateStatus = useCallback(async (id: string, payload: UpdateVerificationStatusPayload) => {
    const response = await fetch(`/api/verification/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseResponse<VerificationRequest>(response);
  }, []);

  const updateCheck = useCallback(async (id: string, checkId: string, payload: UpdateVerificationCheckPayload) => {
    const response = await fetch(`/api/verification/${id}/checks/${checkId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseResponse<VerificationRequest>(response);
  }, []);

  useEffect(() => {
    void fetchVerification(initialQueryRef.current);
  }, [fetchVerification]);

  return {
    requests,
    meta,
    loading,
    error,
    fetchVerification,
    getVerification,
    startVerification,
    updateStatus,
    updateCheck,
  };
}
