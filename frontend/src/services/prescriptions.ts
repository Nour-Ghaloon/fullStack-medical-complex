import { apiRequest } from "@/lib/api";
import type { Prescription } from "@/lib/types";

type PrescriptionStatusApi = "scheduled" | "completed" | "cancelled" | "canceled" | "no-show";

type PrescriptionMedicineApi = {
  id: number;
  name: string;
  pivot?: {
    dosage?: string | null;
    duration?: string | null;
  } | null;
};

type PrescriptionApi = {
  id: number;
  appointment_id: number;
  prescribed_date: string;
  notes: string | null;
  appointment?: {
    id: number;
    status?: PrescriptionStatusApi | null;
    patient?: {
      id: number;
      user?: {
        name: string | null;
      } | null;
    } | null;
    doctor?: {
      id: number;
      user?: {
        name: string | null;
      } | null;
    } | null;
  } | null;
  medicines?: PrescriptionMedicineApi[];
};

type MedicineApi = {
  id: number;
  name: string;
};

export type PrescriptionMedicineOption = {
  id: string;
  name: string;
};

export type PrescriptionMedicationInput = {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type CreatePrescriptionInput = {
  appointmentId: string;
  prescribedDate: string;
  notes?: string | null;
  status?: Prescription["status"];
  medications: PrescriptionMedicationInput[];
};

export type UpdatePrescriptionInput = {
  appointmentId?: string;
  prescribedDate?: string;
  notes?: string | null;
  status?: Prescription["status"];
  medications?: PrescriptionMedicationInput[];
};

const DOSAGE_FREQUENCY_SEPARATOR = "|||";

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const serializeDosageAndFrequency = (dosage: string, frequency: string) =>
  `${dosage.trim()}${DOSAGE_FREQUENCY_SEPARATOR}${frequency.trim()}`;

const parseDosageAndFrequency = (value: string | null | undefined) => {
  const text = value?.trim() ?? "";
  if (!text) {
    return {
      dosage: "",
      frequency: "",
    };
  }

  if (!text.includes(DOSAGE_FREQUENCY_SEPARATOR)) {
    return {
      dosage: text,
      frequency: "",
    };
  }

  const [dosage, frequency] = text.split(DOSAGE_FREQUENCY_SEPARATOR);
  return {
    dosage: dosage?.trim() ?? "",
    frequency: frequency?.trim() ?? "",
  };
};

const toPrescriptionStatus = (
  status: PrescriptionStatusApi | null | undefined,
): Prescription["status"] => {
  if (status === "completed") return "completed";
  if (status === "cancelled" || status === "canceled" || status === "no-show") {
    return "cancelled";
  }
  return "active";
};

const toAppointmentStatus = (
  status: Prescription["status"] | undefined,
): "active" | "completed" | "cancelled" | undefined => {
  if (!status) return undefined;
  if (status === "active") return "active";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return undefined;
};

const toPrescription = (prescription: PrescriptionApi): Prescription => ({
  id: String(prescription.id),
  appointmentId: String(prescription.appointment_id),
  patientId: String(prescription.appointment?.patient?.id ?? ""),
  patientName:
    prescription.appointment?.patient?.user?.name ??
    `Patient #${prescription.appointment?.patient?.id ?? "N/A"}`,
  doctorId: String(prescription.appointment?.doctor?.id ?? ""),
  doctorName:
    prescription.appointment?.doctor?.user?.name ??
    `Doctor #${prescription.appointment?.doctor?.id ?? "N/A"}`,
  date: toDateOnly(prescription.prescribed_date),
  medications: (prescription.medicines ?? []).map((medicine) => {
    const parsed = parseDosageAndFrequency(medicine.pivot?.dosage);
    return {
      medicineId: String(medicine.id),
      name: medicine.name,
      dosage: parsed.dosage,
      frequency: parsed.frequency,
      duration: medicine.pivot?.duration ?? "",
    };
  }),
  status: toPrescriptionStatus(prescription.appointment?.status),
  notes: prescription.notes ?? undefined,
});

const toMedicinesPayload = (medications: PrescriptionMedicationInput[]) =>
  medications.map((item) => ({
    medicine_id: Number(item.medicineId),
    dosage: serializeDosageAndFrequency(item.dosage, item.frequency),
    duration: item.duration.trim(),
  }));

export async function fetchPrescriptions(): Promise<Prescription[]> {
  const prescriptions = await apiRequest<PrescriptionApi[]>("/prescriptions");
  return prescriptions.map(toPrescription);
}

export async function fetchPatientPrescriptions(): Promise<Prescription[]> {
  const prescriptions = await apiRequest<PrescriptionApi[]>("/patient/prescriptions");
  return prescriptions.map(toPrescription);
}

export async function fetchPrescriptionMedicines(): Promise<PrescriptionMedicineOption[]> {
  const medicines = await apiRequest<MedicineApi[]>("/medicines");
  return medicines.map((medicine) => ({
    id: String(medicine.id),
    name: medicine.name,
  }));
}

export async function createPrescription(
  input: CreatePrescriptionInput,
): Promise<Prescription> {
  const prescription = await apiRequest<PrescriptionApi>("/prescriptions", {
    method: "POST",
    body: {
      appointment_id: Number(input.appointmentId),
      prescribed_date: input.prescribedDate,
      notes: input.notes?.trim() || null,
      status: toAppointmentStatus(input.status),
      medicines: toMedicinesPayload(input.medications),
    },
  });
  return toPrescription(prescription);
}

export async function updatePrescription(
  id: string,
  input: UpdatePrescriptionInput,
): Promise<Prescription> {
  const prescription = await apiRequest<PrescriptionApi>(`/prescriptions/${id}`, {
    method: "PUT",
    body: {
      appointment_id: input.appointmentId ? Number(input.appointmentId) : undefined,
      prescribed_date: input.prescribedDate,
      notes: input.notes?.trim() || null,
      status: toAppointmentStatus(input.status),
      medicines: input.medications
        ? toMedicinesPayload(input.medications)
        : undefined,
    },
  });
  return toPrescription(prescription);
}

export async function deletePrescription(id: string): Promise<void> {
  await apiRequest(`/prescriptions/${id}`, {
    method: "DELETE",
  });
}
