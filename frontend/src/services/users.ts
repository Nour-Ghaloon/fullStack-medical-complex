import { apiRequest } from "@/lib/api";
import type { AppRole, SystemUser } from "@/lib/types";

type UserApi = {
  id: number;
  name: string;
  email: string | null;
  role?: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
  roles?: Array<{
    id: number;
    name: string;
    guard_name?: string;
  }>;
};

export type UserOption = {
  id: string;
  name: string;
  email: string | null;
};

type UserResponse = {
  user: UserApi;
  message?: string;
};

const appRoles: AppRole[] = ["admin", "doctor", "patient", "user"];

const toDate = (value: string | null | undefined) => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const normalizeRole = (user: UserApi): AppRole => {
  const apiRole =
    user.roles?.find((roleItem) => roleItem.guard_name === "api")?.name ??
    user.roles?.[0]?.name;
  const role = apiRole ?? user.role ?? "user";
  return appRoles.includes(role as AppRole) ? (role as AppRole) : "user";
};

const toSystemUser = (user: UserApi): SystemUser => ({
  id: String(user.id),
  email: user.email ?? "",
  displayName: user.name,
  role: normalizeRole(user),
  status: "active",
  createdAt: toDate(user.created_at),
  lastLogin: toDate(user.last_login_at) || undefined,
});

export async function fetchUsers(): Promise<UserOption[]> {
  const users = await apiRequest<UserApi[]>("/users");
  return users.map((user) => ({
    id: String(user.id),
    name: user.name,
    email: user.email ?? null,
    role: user.role,
  }));
}

export type CreateSystemUserInput = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
};

export type UpdateSystemUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: AppRole;
};

export async function fetchSystemUsers(): Promise<SystemUser[]> {
  const users = await apiRequest<UserApi[]>("/users");
  return users.map(toSystemUser);
}

export async function createSystemUser(
  input: CreateSystemUserInput,
): Promise<SystemUser> {
  const response = await apiRequest<UserResponse>("/users", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    },
  });

  return toSystemUser(response.user);
}

export async function updateSystemUser(
  id: string,
  input: UpdateSystemUserInput,
): Promise<SystemUser> {
  const response = await apiRequest<UserResponse>(`/users/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    },
  });

  return toSystemUser(response.user);
}

export async function deleteSystemUser(id: string): Promise<void> {
  await apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateProfile(data: { name: string; email?: string }): Promise<UserApi> {
  const response = await apiRequest<UserResponse>("/profile", {
    method: "POST", // حسب الـ Route عندك
    body: data,
  });
  return response.user;
}

export async function changePassword(data: any): Promise<{ message: string }> {
  return await apiRequest<{ message: string }>("/changePassword", {
    method: "POST",
    body: data,
  });
}
