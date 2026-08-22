"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  Role,
  RoleDetails,
  RolePermission,
  UpdateRolePermissionsRequest,
} from "@/types/roles";

interface UseRolesResult {
  roles: Role[];
  loading: boolean;
  error: string | null;

  fetchRoles: () => Promise<void>;

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

  /**
   * Get all roles.
   */
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

  /**
   * Get a single role with users
   * and assigned permissions.
   */
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
          data?.data ??
          data
        ) as RoleDetails;
      },
      [],
    );

  /**
   * Get all available permissions.
   */
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

  /**
   * Get permissions assigned
   * to a specific role.
   */
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

  /**
   * Update permissions assigned
   * to a role.
   */
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
          data?.data ??
          data
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

    getRole,

    getPermissions,

    getRolePermissions,

    updateRolePermissions,
  };
}
