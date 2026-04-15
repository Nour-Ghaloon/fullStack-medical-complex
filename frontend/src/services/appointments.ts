import { apiRequest } from "@/lib/api";
import type { Appointment } from "@/lib/types";

type AppointmentStatusApi = "scheduled" | "completed" | "canceled" | "cancelled" | "no-show";

type AppointmentApi = {
  id: number | string;
  patient_id?: number | string;
  doctor_id?: number | string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: AppointmentStatusApi | null;
  notes?: string | null;
  doctor?: {
    id?: number | string;
    name?: string | null;
    user?: {
      name?: string | null;
    } | null;
  } | null;
  patient?: {
    id?: number | string;
    name?: string | null;
    user?: {
      name?: string | null;
    } | null;
  } | null;
};

type AppointmentsResponse = {
  data: AppointmentApi[];
};

type AppointmentMutationResponse = {
  message?: string;
  data?: AppointmentApi;
};

type PatientDoctorApi = {
  id: number | string;
  name?: string | null;
  specialization?: string | null;
  department?: string | null;
};

type PatientDoctorAvailabilityApi = {
  date: string;
  day: string;
  session_duration: number;
  available_slots: string[];
};

export type PatientDoctorOption = {
  id: string;
  name: string;
  specialization: string;
  department: string;
};

export type PatientDoctorAvailability = {
  date: string;
  day: string;
  sessionDuration: number;
  availableSlots: string[];
};

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const toTimeOnly = (value: string | null | undefined) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const toStatus = (value: AppointmentStatusApi | null | undefined): Appointment["status"] => {
  if (value === "canceled") return "cancelled";
  if (value === "cancelled") return "cancelled";
  if (value === "completed") return "completed";
  if (value === "no-show") return "no-show";
  return "scheduled";
};

const toApiStatus = (
  value: UpdateAppointmentInput["status"] | undefined,
): AppointmentStatusApi | undefined => {
  if (!value) return undefined;
  if (value === "cancelled") return "canceled";
  return value;
};

const toAppointment = (appointment: AppointmentApi): Appointment => {
  const patientId = String(appointment.patient?.id ?? appointment.patient_id ?? "");
  const doctorId = String(appointment.doctor?.id ?? appointment.doctor_id ?? "");
  const startTime = toTimeOnly(appointment.start_time);
  const endTime = toTimeOnly(appointment.end_time);

  return {
    id: String(appointment.id),
    patientId,
    patientName: appointment.patient?.name ?? appointment.patient?.user?.name ?? "",
    doctorId,
    doctorName: appointment.doctor?.name ?? appointment.doctor?.user?.name ?? "",
    date: toDateOnly(appointment.date),
    time: startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime,
    type: undefined,
    status: toStatus(appointment.status),
    notes: appointment.notes ?? undefined,
  };
};

const toPatientDoctorOption = (doctor: PatientDoctorApi): PatientDoctorOption => ({
  id: String(doctor.id),
  name: doctor.name?.trim() || `Doctor #${doctor.id}`,
  specialization: doctor.specialization?.trim() || "General Medicine",
  department: doctor.department?.trim() || "General",
});

export async function fetchAppointments(): Promise<Appointment[]> {
  const response = await apiRequest<AppointmentsResponse | AppointmentApi[]>("/all-appointments");
  const appointments = Array.isArray(response) ? response : response?.data ?? [];
  return appointments.map(toAppointment);
}

export async function fetchDoctorAppointments(): Promise<Appointment[]> {
  const [todayResponse, upcomingResponse] = await Promise.all([
    apiRequest<AppointmentsResponse | AppointmentApi[]>("/doctor/appointments/today"),
    apiRequest<AppointmentsResponse | AppointmentApi[]>("/doctor/appointments/upcoming"),
  ]);

  const todayAppointments = Array.isArray(todayResponse)
    ? todayResponse
    : todayResponse?.data ?? [];
  const upcomingAppointments = Array.isArray(upcomingResponse)
    ? upcomingResponse
    : upcomingResponse?.data ?? [];

  const merged = [...todayAppointments, ...upcomingAppointments];
  const deduped = merged.filter(
    (appointment, index, list) =>
      list.findIndex((item) => String(item.id) === String(appointment.id)) === index,
  );

  return deduped.map(toAppointment);
}

export async function fetchPatientAppointments(): Promise<Appointment[]> {
  const response = await apiRequest<AppointmentsResponse | AppointmentApi[]>("/patient/appointments");
  const appointments = Array.isArray(response) ? response : response?.data ?? [];
  return appointments.map(toAppointment);
}

export async function fetchPatientDoctors(): Promise<PatientDoctorOption[]> {
  const doctors = await apiRequest<PatientDoctorApi[]>("/patient/doctors");
  return doctors.map(toPatientDoctorOption);
}

export async function fetchPatientDoctorAvailability(
  doctorId: string,
  date: string,
  duration = 30,
): Promise<PatientDoctorAvailability> {
  const params = new URLSearchParams({
    date,
    duration: String(duration),
  });

  const availability = await apiRequest<PatientDoctorAvailabilityApi>(
    `/patient/doctors/${doctorId}/availability?${params.toString()}`,
  );

  return {
    date: availability.date,
    day: availability.day,
    sessionDuration: availability.session_duration,
    availableSlots: availability.available_slots ?? [],
  };
}

export type DoctorRescheduleAppointmentInput = {
  date: string;
  startTime: string;
  endTime: string;
};

export type DoctorCompleteAppointmentInput = {
  diagnosis: string;
  notes?: string | null;
};

export type PatientCreateAppointmentInput = {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
};

export async function updateDoctorAppointmentStatus(
  id: string,
  status: "scheduled" | "cancelled",
): Promise<void> {
  await apiRequest<AppointmentMutationResponse>(`/doctor/appointments/${id}`, {
    method: "PUT",
    body: {
      status: toApiStatus(status),
    },
  });
}

export async function rescheduleDoctorAppointment(
  id: string,
  input: DoctorRescheduleAppointmentInput,
): Promise<void> {
  await apiRequest<AppointmentMutationResponse>(`/doctor/reschedule/${id}`, {
    method: "PUT",
    body: {
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
    },
  });
}

export async function completeDoctorAppointment(
  id: string,
  input: DoctorCompleteAppointmentInput,
): Promise<void> {
  await apiRequest<AppointmentMutationResponse>(`/doctor/complete/${id}`, {
    method: "PUT",
    body: {
      diagnosis: input.diagnosis,
      notes: input.notes ?? null,
    },
  });
}

export async function createPatientAppointment(
  input: PatientCreateAppointmentInput,
): Promise<void> {
  await apiRequest<AppointmentMutationResponse>("/patient/appointments", {
    method: "POST",
    body: {
      doctor_id: Number(input.doctorId),
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes ?? null,
    },
  });
}

export async function cancelPatientAppointment(id: string): Promise<void> {
  await apiRequest<AppointmentMutationResponse>(`/patient/appointments/${id}/cancel`, {
    method: "PUT",
  });
}

export type CreateAppointmentInput = {
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
};

export type UpdateAppointmentInput = {
  doctorId?: string;
  patientId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: "scheduled" | "completed" | "cancelled";
  notes?: string | null;
};

export async function createAppointment(input: CreateAppointmentInput): Promise<void> {
  await apiRequest<AppointmentMutationResponse>("/store-appointments", {
    method: "POST",
    body: {
      doctor_id: Number(input.doctorId),
      patient_id: Number(input.patientId),
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes ?? null,
    },
  });
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<void> {
  await apiRequest<AppointmentMutationResponse>(`/update-appointments/${id}`, {
    method: "PUT",
    body: {
      doctor_id: input.doctorId ? Number(input.doctorId) : undefined,
      patient_id: input.patientId ? Number(input.patientId) : undefined,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      status: toApiStatus(input.status),
      notes: input.notes,
    },
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiRequest(`/delete-appointments/${id}`, {
    method: "DELETE",
  });
}
