import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDoctor,
  deleteDoctor,
  fetchDoctors,
  updateDoctor,
  type CreateDoctorInput,
  type UpdateDoctorInput,
} from "@/services/doctors";

export const doctorsQueryKey = ["doctors"];

export function useDoctors() {
  return useQuery({
    queryKey: doctorsQueryKey,
    queryFn: fetchDoctors,
    staleTime: 30_000,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDoctorInput) => createDoctor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorInput }) =>
      updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey });
    },
  });
}
