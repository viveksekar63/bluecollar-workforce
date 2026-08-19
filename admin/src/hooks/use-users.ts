"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserRolesPayload,
  UpdateUserStatusPayload,
  User,
  UsersQuery,
  UsersResponse,
} from "@/types/users";

interface UseUsersResult {
  users: User[];
  meta: UsersResponse["meta"];
  loading: boolean;
  error: string | null;

  fetchUsers: (
    query?: UsersQuery,
  ) => Promise<void>;

  createUser: (
    payload: CreateUserPayload,
  ) => Promise<User>;

  updateUser: (
    id: string,
    payload: UpdateUserPayload,
  ) => Promise<User>;

  updateUserRoles: (
    id: string,
    payload: UpdateUserRolesPayload,
  ) => Promise<User>;

  updateUserStatus: (
    id: string,
    payload: UpdateUserStatusPayload,
  ) => Promise<User>;

  deleteUser: (
    id: string,
  ) => Promise<void>;
}

const DEFAULT_QUERY: UsersQuery = {
  page: 1,
  limit: 20,
};

const DEFAULT_META: UsersResponse["meta"] = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const data = await response
    .json()
    .catch(() => ({}));

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

function buildQueryString(
  query: UsersQuery = {},
): string {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.roleId) {
    params.set("roleId", query.roleId);
  }

  if (query.page) {
    params.set(
      "page",
      String(query.page),
    );
  }

  if (query.limit) {
    params.set(
      "limit",
      String(query.limit),
    );
  }

  const value = params.toString();

  return value ? `?${value}` : "";
}

export function useUsers(
  initialQuery: UsersQuery = DEFAULT_QUERY,
): UseUsersResult {
  /**
   * Keep the initial query stable.
   *
   * This prevents a new object reference from
   * triggering the fetch effect on every render.
   */
  const initialQueryRef = useRef<UsersQuery>(
    initialQuery,
  );

  const [users, setUsers] = useState<User[]>(
    [],
  );

  const [meta, setMeta] =
    useState<UsersResponse["meta"]>(
      DEFAULT_META,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fetchUsers = useCallback(
    async (
      query: UsersQuery = initialQueryRef.current,
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/users${buildQueryString(query)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await parseResponse<UsersResponse>(
            response,
          );

        setUsers(data.data);
        setMeta(data.meta);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load users";

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createUser = useCallback(
    async (
      payload: CreateUserPayload,
    ): Promise<User> => {
      const response = await fetch(
        "/api/users",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      return parseResponse<User>(
        response,
      );
    },
    [],
  );

  const updateUser = useCallback(
    async (
      id: string,
      payload: UpdateUserPayload,
    ): Promise<User> => {
      const response = await fetch(
        `/api/users/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      return parseResponse<User>(
        response,
      );
    },
    [],
  );

  const updateUserRoles = useCallback(
    async (
      id: string,
      payload: UpdateUserRolesPayload,
    ): Promise<User> => {
      const response = await fetch(
        `/api/users/${id}/roles`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      return parseResponse<User>(
        response,
      );
    },
    [],
  );

  const updateUserStatus = useCallback(
    async (
      id: string,
      payload: UpdateUserStatusPayload,
    ): Promise<User> => {
      const response = await fetch(
        `/api/users/${id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      return parseResponse<User>(
        response,
      );
    },
    [],
  );

  const deleteUser = useCallback(
    async (id: string): Promise<void> => {
      const response = await fetch(
        `/api/users/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      await parseResponse<{
        message: string;
      }>(response);
    },
    [],
  );

  /**
   * Initial users request.
   *
   * fetchUsers is stable because it has
   * no changing dependencies.
   */
  useEffect(() => {
    void fetchUsers(initialQueryRef.current);
  }, [fetchUsers]);

  return {
    users,
    meta,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    updateUserRoles,
    updateUserStatus,
    deleteUser,
  };
}