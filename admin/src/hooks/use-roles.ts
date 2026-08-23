"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  Role,
  RoleDetails,
  RolePermission,
  UpdateRolePermissionsRequest,
} from "@/types/roles";

interface CreateRoleRequest {
  name: string;
  description?: string;
}

interface UseRolesResult {
  roles: Role[];
  loading: boolean;
  error: string | null;

  fetchRoles: () => Promise<void>;

  createRole: (
    payload: CreateRoleRequest,
  ) => Promise<Role>;

  getRole: (
    id: string,
  ) => Promise<RoleDetails>;

  getPermissions: () => Promise<
    RolePermission[]
  >;

  getRolePermissions: (
    id: string,
  ) => Promise<RolePermission[]>;

  updateRolePermissions: (
    id: string,
    payload: UpdateRolePermissionsRequest,
  ) => Promise<RoleDetails>;
}

function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .join(", ");
    }
  }

  return fallback;
}

async function parseResponse(
  response: Response,
) {
  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Request failed",
      ),
    );
  }

  return data;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] =
    useState<Role[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fetchRoles =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/roles",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await parseResponse(response);

        setRoles(
          Array.isArray(data)
            ? data
            : data?.data ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load roles",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const createRole =
    useCallback(
      async (
        payload: CreateRoleRequest,
      ): Promise<Role> => {
        const response = await fetch(
          "/api/roles",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: payload.name.trim(),
              description:
                payload.description?.trim() ||
                undefined,
            }),
          },
        );

        const data =
          await parseResponse(response);

        const role = (
          data?.data ?? data
        ) as Role;

        setRoles((current) => [
          ...current,
          role,
        ]);

        return role;
      },
      [],
    );

  const getRole =
    useCallback(
      async (
        id: string,
      ): Promise<RoleDetails> => {
        const response = await fetch(
          `/api/roles/${id}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await parseResponse(response);

        return (
          data?.data ?? data
        ) as RoleDetails;
      },
      [],
    );

  const getPermissions =
    useCallback(
      async (): Promise<
        RolePermission[]
      > => {
        const response = await fetch(
          "/api/roles/permissions",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await parseResponse(response);

        return (
          Array.isArray(data)
            ? data
            : data?.data ?? []
        ) as RolePermission[];
      },
      [],
    );

  const getRolePermissions =
    useCallback(
      async (
        id: string,
      ): Promise<
        RolePermission[]
      > => {
        const response = await fetch(
          `/api/roles/${id}/permissions`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await parseResponse(response);

        return (
          Array.isArray(data)
            ? data
            : data?.data ?? []
        ) as RolePermission[];
      },
      [],
    );

  const updateRolePermissions =
    useCallback(
      async (
        id: string,
        payload: UpdateRolePermissionsRequest,
      ): Promise<RoleDetails> => {
        const response = await fetch(
          `/api/roles/${id}/permissions`,
          {
            method: "PATCH",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload,
            ),
          },
        );

        const data =
          await parseResponse(response);

        return (
          data?.data ?? data
        ) as RoleDetails;
      },
      [],
    );

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,

    fetchRoles,
    createRole,

    getRole,
    getPermissions,
    getRolePermissions,
    updateRolePermissions,
  };
}