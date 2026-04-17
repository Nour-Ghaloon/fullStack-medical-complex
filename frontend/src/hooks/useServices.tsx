import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
  type ServiceInput,
} from "@/services/services";
import { apiRequest } from "@/lib/api";
export const servicesQueryKey = ["services"];

export function useServices() {
  return useQuery({
    queryKey: servicesQueryKey,
    queryFn: fetchServices,
    staleTime: 60_000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ServiceInput) => createService(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceInput }) =>
    updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      // افترضت أن عندك api endpoint للأقسام
      const response = await apiRequest<any[]>("/departments");
      return response;
    },
  });
}