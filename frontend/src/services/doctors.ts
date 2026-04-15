import { apiRequest } from "@/lib/api";
import type { Doctor } from "@/lib/types";

export type DoctorStatusApi = "active" | "inactive" | "on_leave";

type DoctorApi = {
  id: number;
  user_id: number;
  department_id: number;
  specialization: string | null;
  hire_date: string;
  bio: string | null;
  status: DoctorStatusApi;
  phone: string | null;
  address: string | null;
  user?: {
    id: number;
    name: string;
    email: string | null;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
};

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const toDoctor = (doctor: DoctorApi): Doctor => ({
  id: String(doctor.id),
  name: doctor.user?.name ?? `Doctor #${doctor.id}`,
  email: doctor.user?.email ?? "",
  phone: doctor.phone ?? "",
  specialty: doctor.specialization ?? "General Medicine",
  department: doctor.department?.name ?? "General",
  licenseNumber: null,
  status: doctor.status,
  userId: String(doctor.user_id),
  departmentId: String(doctor.department_id),
  hireDate: doctor.hire_date,
  bio: doctor.bio ?? null,
  address: doctor.address ?? null,
});

export async function fetchDoctors(): Promise<Doctor[]> {
  const response = await apiRequest<{ data: PaginatedResponse<DoctorApi> | DoctorApi[] }>(
    "/doctors?per_page=200",
  );
  const paginated = response?.data;
  if (!paginated) return [];
  if (Array.isArray(paginated)) {
    return paginated.map(toDoctor);
  }
  return paginated.data.map(toDoctor);
}

export type CreateDoctorInput = {
  userId: string;
  departmentId: string;
  specialization?: string | null;
  hireDate: string;
  status: DoctorStatusApi;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
};

export type UpdateDoctorInput = {
  departmentId?: string;
  specialization?: string | null;
  hireDate?: string;
  status?: DoctorStatusApi;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
};

export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
  const response = await apiRequest<{ data: DoctorApi }>("/doctors", {
    method: "POST",
    body: {
      user_id: Number(input.userId),
      department_id: Number(input.departmentId),
      specialization: input.specialization ?? null,
      hire_date: input.hireDate,
      status: input.status,
      phone: input.phone ?? null,
      address: input.address ?? null,
      bio: input.bio ?? null,
    },
  });
  return toDoctor(response.data);
}

export async function updateDoctor(
  id: string,
  input: UpdateDoctorInput,
): Promise<Doctor> {
  const response = await apiRequest<{ data: DoctorApi }>(`/doctors/${id}`, {
    method: "PUT",
    body: {
      department_id: input.departmentId ? Number(input.departmentId) : undefined,
      specialization: input.specialization ?? null,
      hire_date: input.hireDate,
      status: input.status,
      phone: input.phone ?? null,
      address: input.address ?? null,
      bio: input.bio ?? null,
    },
  });
  return toDoctor(response.data);
}

export async function deleteDoctor(id: string): Promise<void> {
  await apiRequest<void>(`/doctors/${id}`, {
    method: "DELETE",
  });
}
