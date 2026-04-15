import { apiRequest } from "@/lib/api";
import type { MedicalRecord } from "@/lib/types";

type MedicalRecordApi = {
  id: number;
  patient_id: number;
  doctor_id: number;
  visit_date: string;
  diagnosis: string | null;
  notes: string | null;
  patient?: {
    id: number;
    user?: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
  doctor?: {
    id: number;
    user?: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
};

export type CreateMedicalRecordInput = {
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string | null;
};

export type UpdateMedicalRecordInput = {
  patientId?: string;
  doctorId?: string;
  date?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string | null;
};

const TREATMENT_PREFIX = "Treatment:";
const NOTES_PREFIX = "Notes:";

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const parseTreatmentAndNotes = (rawNotes: string | null | undefined) => {
  if (!rawNotes) {
    return {
      treatment: "",
      notes: undefined as string | undefined,
    };
  }

  const trimmed = rawNotes.trim();
  if (trimmed.startsWith(TREATMENT_PREFIX)) {
    const withoutPrefix = trimmed.slice(TREATMENT_PREFIX.length).trim();
    const notesIndex = withoutPrefix.indexOf(`\n${NOTES_PREFIX}`);

    if (notesIndex >= 0) {
      return {
        treatment: withoutPrefix.slice(0, notesIndex).trim(),
        notes: withoutPrefix
          .slice(notesIndex + `\n${NOTES_PREFIX}`.length)
          .trim(),
      };
    }

    return {
      treatment: withoutPrefix,
      notes: undefined as string | undefined,
    };
  }

  return {
    treatment: trimmed,
    notes: undefined as string | undefined,
  };
};

const serializeTreatmentAndNotes = (
  treatment: string | undefined,
  notes: string | null | undefined,
) => {
  const cleanTreatment = treatment?.trim() ?? "";
  const cleanNotes = notes?.trim() ?? "";

  if (cleanTreatment && cleanNotes) {
    return `${TREATMENT_PREFIX} ${cleanTreatment}\n${NOTES_PREFIX} ${cleanNotes}`;
  }

  if (cleanTreatment) {
    return `${TREATMENT_PREFIX} ${cleanTreatment}`;
  }

  return cleanNotes || null;
};

const toMedicalRecord = (record: MedicalRecordApi): MedicalRecord => {
  const parsed = parseTreatmentAndNotes(record.notes);

  return {
    id: String(record.id),
    patientId: String(record.patient_id),
    patientName: record.patient?.user?.name ?? `Patient #${record.patient_id}`,
    doctorId: String(record.doctor_id),
    doctorName: record.doctor?.user?.name ?? `Doctor #${record.doctor_id}`,
    date: toDateOnly(record.visit_date),
    diagnosis: record.diagnosis ?? "",
    treatment: parsed.treatment,
    notes: parsed.notes,
  };
};

export async function fetchMedicalRecords(): Promise<MedicalRecord[]> {
  const records = await apiRequest<MedicalRecordApi[]>("/medical-records");
  return records.map(toMedicalRecord);
}

export async function fetchDoctorMedicalRecords(): Promise<MedicalRecord[]> {
  const records = await apiRequest<MedicalRecordApi[]>("/doctor/medical-records");
  return records.map(toMedicalRecord);
}

export async function fetchPatientMedicalRecords(): Promise<MedicalRecord[]> {
  const records = await apiRequest<MedicalRecordApi[]>("/patient/medical-records");
  return records.map(toMedicalRecord);
}

export async function createMedicalRecord(
  input: CreateMedicalRecordInput,
): Promise<MedicalRecord> {
  const record = await apiRequest<MedicalRecordApi>("/medical-records", {
    method: "POST",
    body: {
      patient_id: Number(input.patientId),
      doctor_id: Number(input.doctorId),
      visit_date: input.date,
      diagnosis: input.diagnosis.trim(),
      notes: serializeTreatmentAndNotes(input.treatment, input.notes),
    },
  });

  return toMedicalRecord(record);
}

export async function updateMedicalRecord(
  id: string,
  input: UpdateMedicalRecordInput,
): Promise<MedicalRecord> {
  const record = await apiRequest<MedicalRecordApi>(`/medical-records/${id}`, {
    method: "PUT",
    body: {
      patient_id: input.patientId ? Number(input.patientId) : undefined,
      doctor_id: input.doctorId ? Number(input.doctorId) : undefined,
      visit_date: input.date,
      diagnosis: input.diagnosis?.trim(),
      notes:
        input.treatment !== undefined || input.notes !== undefined
          ? serializeTreatmentAndNotes(input.treatment, input.notes)
          : undefined,
    },
  });

  return toMedicalRecord(record);
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  await apiRequest(`/medical-records/${id}`, {
    method: "DELETE",
  });
}
