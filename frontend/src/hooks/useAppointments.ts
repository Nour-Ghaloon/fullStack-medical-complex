import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPatientAppointment,
  completeDoctorAppointment,
  createAppointment,
  createPatientAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchDoctorAppointments,
  fetchPatientAppointments,
  fetchPatientDoctorAvailability,
  fetchPatientDoctors,
  rescheduleDoctorAppointment,
  updateAppointment,
  updateDoctorAppointmentStatus,
  type CreateAppointmentInput,
  type DoctorCompleteAppointmentInput,
  type DoctorRescheduleAppointmentInput,
  type PatientCreateAppointmentInput,
  type UpdateAppointmentInput,
} from "@/services/appointments";

export const appointmentsQueryKey = ["appointments"];
export const doctorAppointmentsQueryKey = ["doctor-appointments"];
export const patientAppointmentsQueryKey = ["patient-appointments"];
export const patientDoctorsQueryKey = ["patient-doctors"];

export function useAppointments() {
  return useQuery({
    queryKey: appointmentsQueryKey,
    queryFn: fetchAppointments,
    staleTime: 30_000,
  });
}

export function useDoctorAppointments(enabled = true) {
  return useQuery({
    queryKey: doctorAppointmentsQueryKey,
    queryFn: fetchDoctorAppointments,
    enabled,
    staleTime: 30_000,
  });
}

export function usePatientAppointments(enabled = true) {
  return useQuery({
    queryKey: patientAppointmentsQueryKey,
    queryFn: fetchPatientAppointments,
    enabled,
    staleTime: 30_000,
  });
}

export function usePatientDoctors(enabled = true) {
  return useQuery({
    queryKey: patientDoctorsQueryKey,
    queryFn: fetchPatientDoctors,
    enabled,
    staleTime: 60_000,
  });
}

export function usePatientDoctorAvailability(
  doctorId: string | undefined,
  date: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["patient-doctor-availability", doctorId, date],
    queryFn: () => fetchPatientDoctorAvailability(doctorId as string, date as string),
    enabled: enabled && Boolean(doctorId) && Boolean(date),
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => createAppointment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentInput }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}

export function useDoctorAppointmentStatusUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "scheduled" | "cancelled" }) =>
      updateDoctorAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorAppointmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "appointments", "doctor"] });
    },
  });
}

export function useDoctorAppointmentReschedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoctorRescheduleAppointmentInput }) =>
      rescheduleDoctorAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorAppointmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "appointments", "doctor"] });
    },
  });
}

export function useDoctorAppointmentComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoctorCompleteAppointmentInput }) =>
      completeDoctorAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorAppointmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "appointments", "doctor"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-medical-records"] });
    },
  });
}

export function useCreatePatientAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientCreateAppointmentInput) => createPatientAppointment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientAppointmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "appointments", "patient"] });
    },
  });
}

export function useCancelPatientAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPatientAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientAppointmentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "appointments", "patient"] });
    },
  });
}
