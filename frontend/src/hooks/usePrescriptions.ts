import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPrescription,
  deletePrescription,
  fetchPatientPrescriptions,
  fetchPrescriptionMedicines,
  fetchPrescriptions,
  updatePrescription,
  type CreatePrescriptionInput,
  type UpdatePrescriptionInput,
} from "@/services/prescriptions";
import { apiRequest } from "@/lib/api";

export const prescriptionsQueryKey = ["prescriptions"];
export const prescriptionMedicinesQueryKey = ["prescription-medicines"];
export const patientPrescriptionsQueryKey = ["patient-prescriptions"];

export function usePrescriptions(enabled = true) {
  return useQuery({
    queryKey: prescriptionsQueryKey,
    queryFn: fetchPrescriptions,
    enabled,
    staleTime: 30_000,
  });
}

export function usePatientPrescriptions(enabled = true) {
  return useQuery({
    queryKey: patientPrescriptionsQueryKey,
    queryFn: fetchPatientPrescriptions,
    enabled,
    staleTime: 30_000,
  });
}

export function usePrescriptionMedicines(enabled = true) {
  return useQuery({
    queryKey: prescriptionMedicinesQueryKey,
    queryFn: fetchPrescriptionMedicines,
    enabled,
    staleTime: 60_000,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePrescriptionInput) => createPrescription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prescriptionsQueryKey });
    },
  });
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrescriptionInput }) =>
      updatePrescription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prescriptionsQueryKey });
    },
  });
}

// export function useDeletePrescription() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) => deletePrescription(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: prescriptionsQueryKey });
//     },
//   });
// }
export function useDeletePrescription() {
  const queryClient = useQueryClient();

  // يجب تحديد النوع <void, Error, number> 
  // number هنا تعني أن الـ mutate تأخذ id نوعه رقم
  return useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      await apiRequest(`/prescriptions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
}
