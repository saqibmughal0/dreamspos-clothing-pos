import { UserRole, RolePermissions, hasPermission } from "@dreamspos/shared";

export interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string | null;
  companyId: string;
}

export const getCurrentUser = (): LoggedInUser | null => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const checkPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  return hasPermission(user.role, permission);
};

export const checkRole = (allowedRoles: UserRole[]): boolean => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};
