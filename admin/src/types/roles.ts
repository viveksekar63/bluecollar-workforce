export interface Role {
  id: string;
  name: string;
  userCount: number;
  permissionCount: number;
}

export interface RoleUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string;
  status: string;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleDetails {
  id: string;
  name: string;
  users: RoleUser[];
  permissions: RolePermission[];
}

export interface RolesResponse {
  data: Role[];
}

export interface PermissionsResponse {
  data: RolePermission[];
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}
