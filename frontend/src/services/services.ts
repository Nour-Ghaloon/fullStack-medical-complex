import { apiRequest } from "@/lib/api";
import type { Service } from "@/lib/types";

type ServiceApi = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  doctors_count?: number;
  department_id: number; 
  price: number;        
  duration?: number | null; // أضيفي هذا السطر هنا
  status: "active" | "inactive";
  department?: { id: number; name: string };
};

export type ServiceOption = {
  id: string;
  name: string;
};

export type ServiceInput = {
  name: string;
  code: string;
  description?: string | null;
};

const toService = (service: ServiceApi): Service => ({
  id: String(service.id),
  name: service.name,
  code: service.code,
  description: service.description ?? "",
  department_id: service.department_id ?? 0, 
  price: Number(service.price ?? 0), // نصيحة: حوليها لـ Number للتأكد لأن بعض قواعد البيانات ترسل الـ Decimal كـ String
  duration: service.duration ?? 0,        // المدة بالدقائق
  status: service.status,
  department_name: service.department?.name ?? "N/A",
});

export async function fetchServices(): Promise<Service[]> {
  const services = await apiRequest<ServiceApi[]>("/services");
  return services.map(toService);
}

export async function fetchServiceOptions(): Promise<ServiceOption[]> {
  const services = await fetchServices();
  return services.map((service) => ({
    id: service.id,
    name: service.name,
  }));
}

export async function createService(input: ServiceInput): Promise<Service> {
  const service = await apiRequest<ServiceApi>("/services", {
    method: "POST",
    body: {
      ...input,
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description?.trim() || null,
      
    },
  });
  return toService(service);
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<Service> {
  const service = await apiRequest<ServiceApi>(`/services/${id}`, {
    method: "PUT",
    body: {
      ...input,
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description?.trim() || null,
    },
  });
  return toService(service);
}

export async function deleteService(id: string): Promise<void> {
  await apiRequest(`/services/${id}`, {
    method: "DELETE",
  });
}
