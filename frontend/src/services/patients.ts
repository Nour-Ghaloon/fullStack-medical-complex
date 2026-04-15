import { apiRequest } from "@/lib/api";
import type { Patient } from "@/lib/types";

type PatientApi = {
  id: number;
  user_id: number;
  date_of_birth: string;
  gender: "male" | "female";
  phone: string | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_diseases: string | null;
  medical_history: string | null;
  status: "active" | "inactive";
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string | null;
  } | null;
};

const toDate = (value: string | null | undefined) => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const toPatient = (patient: PatientApi): Patient => ({
  id: String(patient.id),
  name: patient.user?.name ?? `Patient #${patient.id}`,
  email: patient.user?.email ?? "",
  phone: patient.phone ?? "",
  dateOfBirth: toDate(patient.date_of_birth),
  gender: patient.gender,
  address: patient.address ?? "",
  bloodType: patient.blood_type ?? undefined,
  allergies: patient.allergies ?? undefined,
  chronicDiseases: patient.chronic_diseases ?? undefined,
  medicalHistory: patient.medical_history ?? undefined,
  emergencyContact: undefined,
  status: patient.status,
  createdAt: toDate(patient.created_at),
});

export type CreatePatientInput = {
  userId: string;
  dateOfBirth: string;
  gender: "male" | "female";
  phone?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  medicalHistory?: string | null;
  status: "active" | "inactive";
};

export type UpdatePatientInput = {
  dateOfBirth?: string;
  gender?: "male" | "female";
  phone?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  medicalHistory?: string | null;
  status?: "active" | "inactive";
};

export async function fetchPatients(): Promise<Patient[]> {
  const patients = await apiRequest<PatientApi[]>("/patients");
  return patients.map(toPatient);
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const patient = await apiRequest<PatientApi>("/patients", {
    method: "POST",
    body: {
      user_id: Number(input.userId),
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone ?? null,
      address: input.address ?? null,
      blood_type: input.bloodType ?? null,
      allergies: input.allergies ?? null,
      chronic_diseases: input.chronicDiseases ?? null,
      medical_history: input.medicalHistory ?? null,
      status: input.status,
    },
  });
  return toPatient(patient);
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput,
): Promise<Patient> {
  const patient = await apiRequest<PatientApi>(`/patients/${id}`, {
    method: "PUT",
    body: {
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone ?? null,
      address: input.address ?? null,
      blood_type: input.bloodType ?? null,
      allergies: input.allergies ?? null,
      chronic_diseases: input.chronicDiseases ?? null,
      medical_history: input.medicalHistory ?? null,
      status: input.status,
    },
  });
  return toPatient(patient);
}

export async function deletePatient(id: string): Promise<void> {
  await apiRequest(`/patients/${id}`, {
    method: "DELETE",
  });
}
