export interface Role {
  id: string;
  name: string;
  userCount: number;
  permissionCount: number;
}

export interface RolesResponse {
  data: Role[];
}
