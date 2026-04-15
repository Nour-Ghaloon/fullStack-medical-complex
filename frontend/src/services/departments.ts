import { apiRequest } from "@/lib/api";
import type { Department } from "@/lib/types";

type DepartmentApi = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  doctors_count?: number;
};

export type DepartmentOption = {
  id: string;
  name: string;
};

export type DepartmentInput = {
  name: string;
  code: string;
  description?: string | null;
};

const toDepartment = (department: DepartmentApi): Department => ({
  id: String(department.id),
  name: department.name,
  code: department.code,
  description: department.description ?? "",
  headDoctor: undefined,
  staffCount: department.doctors_count ?? 0,
});

export async function fetchDepartments(): Promise<Department[]> {
  const departments = await apiRequest<DepartmentApi[]>("/departments");
  return departments.map(toDepartment);
}

export async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const departments = await fetchDepartments();
  return departments.map((department) => ({
    id: department.id,
    name: department.name,
  }));
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const department = await apiRequest<DepartmentApi>("/departments", {
    method: "POST",
    body: {
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description?.trim() || null,
    },
  });
  return toDepartment(department);
}

export async function updateDepartment(
  id: string,
  input: DepartmentInput,
): Promise<Department> {
  const department = await apiRequest<DepartmentApi>(`/departments/${id}`, {
    method: "PUT",
    body: {
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description?.trim() || null,
    },
  });
  return toDepartment(department);
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiRequest(`/departments/${id}`, {
    method: "DELETE",
  });
}
