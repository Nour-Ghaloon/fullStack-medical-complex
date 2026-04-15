import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMedicalRecord,
  deleteMedicalRecord,
  fetchDoctorMedicalRecords,
  fetchMedicalRecords,
  fetchPatientMedicalRecords,
  updateMedicalRecord,
  type CreateMedicalRecordInput,
  type UpdateMedicalRecordInput,
} from "@/services/medicalRecords";

export const medicalRecordsQueryKey = ["medical-records"];
export const doctorMedicalRecordsQueryKey = ["doctor-medical-records"];
export const patientMedicalRecordsQueryKey = ["patient-medical-records"];

export function useMedicalRecords() {
  return useQuery({
    queryKey: medicalRecordsQueryKey,
    queryFn: fetchMedicalRecords,
    staleTime: 30_000,
  });
}

export function useDoctorMedicalRecords(enabled = true) {
  return useQuery({
    queryKey: doctorMedicalRecordsQueryKey,
    queryFn: fetchDoctorMedicalRecords,
    enabled,
    staleTime: 30_000,
  });
}

export function usePatientMedicalRecords(enabled = true) {
  return useQuery({
    queryKey: patientMedicalRecordsQueryKey,
    queryFn: fetchPatientMedicalRecords,
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMedicalRecordInput) => createMedicalRecord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalRecordsQueryKey });
    },
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicalRecordInput }) =>
      updateMedicalRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalRecordsQueryKey });
    },
  });
}

export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedicalRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalRecordsQueryKey });
    },
  });
}
