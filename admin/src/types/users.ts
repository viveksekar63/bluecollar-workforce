export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserRole {
  id: string;
  name: string;
}

export interface UserWorker {
  id: string;
  workerCode: string;
  verificationStatus: string;
}

export interface UserEmployer {
  id: string;
}

export interface User {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  status: UserStatus | string;
  createdAt: string;
  updatedAt?: string;
  roles: UserRole[];
  worker?: UserWorker | null;
  employer?: UserEmployer | null;
}

export interface UsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  data: User[];
  meta: UsersMeta;
}

export interface UsersQuery {
  search?: string;
  status?: string;
  roleId?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  phone: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  profilePhotoUrl?: string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  phone?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
}

export interface UpdateUserRolesPayload {
  roleIds: string[];
}

export interface UpdateUserStatusPayload {
  status: string;
}