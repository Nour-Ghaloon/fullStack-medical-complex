import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Pill,
  Trash2,
} from "lucide-react";
import type { Prescription } from "@/lib/types";
import {
  useCreatePrescription,
  useDeletePrescription,
  usePrescriptionMedicines,
  usePrescriptions,
  useUpdatePrescription,
} from "@/hooks/usePrescriptions";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";

type MedicationFormState = {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type PrescriptionFormState = {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  prescribedDate: string;
  notes: string;
  medications: MedicationFormState[];
};

const statusColors: Record<Prescription["status"], string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const getToday = () => new Date().toISOString().slice(0, 10);

const createEmptyMedication = (): MedicationFormState => ({
  medicineId: "",
  dosage: "",
  frequency: "",
  duration: "",
});

const createEmptyForm = (): PrescriptionFormState => ({
  patientId: "",
  doctorId: "",
  appointmentId: "",
  prescribedDate: getToday(),
  notes: "",
  medications: [createEmptyMedication()],
});

const toFormState = (prescription: Prescription): PrescriptionFormState => ({
  patientId: prescription.patientId,
  doctorId: prescription.doctorId,
  appointmentId: prescription.appointmentId ?? "",
  prescribedDate: prescription.date || getToday(),
  notes: prescription.notes ?? "",
  medications:
    prescription.medications.length > 0
      ? prescription.medications.map((medication) => ({
          medicineId: medication.medicineId ?? "",
          dosage: medication.dosage,
          frequency: medication.frequency,
          duration: medication.duration,
        }))
      : [createEmptyMedication()],
});

export default function Prescriptions() {
  const { data: prescriptions = [], isLoading, isError, error } = usePrescriptions();
  const { data: medicines = [], isLoading: medicinesLoading } = usePrescriptionMedicines();
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const createPrescriptionMutation = useCreatePrescription();
  const updatePrescriptionMutation = useUpdatePrescription();
  const deletePrescriptionMutation = useDeletePrescription();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(
    null,
  );
  const [formState, setFormState] = useState<PrescriptionFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingPrescriptionId !== null;
  const isSaving =
    createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending;

  const usedAppointmentIds = useMemo(
    () =>
      new Set(
        prescriptions
          .map((prescription) => prescription.appointmentId)
          .filter((value): value is string => Boolean(value)),
      ),
    [prescriptions],
  );

  const appointmentOptions = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          (!formState.patientId || appointment.patientId === formState.patientId) &&
          (!formState.doctorId || appointment.doctorId === formState.doctorId) &&
          !usedAppointmentIds.has(appointment.id) ||
          appointment.id === formState.appointmentId,
      ),
    [
      appointments,
      usedAppointmentIds,
      formState.appointmentId,
      formState.patientId,
      formState.doctorId,
    ],
  );

  const appointmentById = useMemo(
    () => new Map(appointments.map((appointment) => [appointment.id, appointment])),
    [appointments],
  );

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const query = searchQuery.toLowerCase();
    return (
      prescription.patientName.toLowerCase().includes(query) ||
      prescription.doctorName.toLowerCase().includes(query) ||
      prescription.medications.some((medication) =>
        medication.name.toLowerCase().includes(query),
      )
    );
  });

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setViewDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingPrescriptionId(null);
    setFormState(createEmptyForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (prescription: Prescription) => {
    setEditingPrescriptionId(prescription.id);
    setFormState(toFormState(prescription));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingPrescriptionId(null);
      setFormState(createEmptyForm());
      setFormError(null);
    }
  };

  const handleMedicationChange = (
    index: number,
    field: keyof MedicationFormState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      medications: prev.medications.map((medication, idx) =>
        idx === index ? { ...medication, [field]: value } : medication,
      ),
    }));
  };

  const addMedication = () => {
    setFormState((prev) => ({
      ...prev,
      medications: [...prev.medications, createEmptyMedication()],
    }));
  };

  const removeMedication = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      medications:
        prev.medications.length === 1
          ? [createEmptyMedication()]
          : prev.medications.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    setFormError(null);
    if (
      !formState.patientId ||
      !formState.doctorId ||
      !formState.appointmentId ||
      !formState.prescribedDate
    ) {
      setFormError("Patient, doctor, appointment, and date are required.");
      return;
    }

    const medications = formState.medications
      .filter(
        (medication) =>
          medication.medicineId &&
          medication.dosage.trim() &&
          medication.frequency.trim() &&
          medication.duration.trim(),
      )
      .map((medication) => ({
        medicineId: medication.medicineId,
        dosage: medication.dosage,
        frequency: medication.frequency,
        duration: medication.duration,
      }));

    if (medications.length === 0) {
      setFormError("At least one complete medication entry is required.");
      return;
    }

    try {
      if (isEditing && editingPrescriptionId) {
        await updatePrescriptionMutation.mutateAsync({
          id: editingPrescriptionId,
          data: {
            appointmentId: formState.appointmentId,
            prescribedDate: formState.prescribedDate,
            notes: formState.notes,
            medications,
          },
        });
      } else {
        await createPrescriptionMutation.mutateAsync({
          appointmentId: formState.appointmentId,
          prescribedDate: formState.prescribedDate,
          notes: formState.notes,
          medications,
        });
      }

      setFormDialogOpen(false);
      setEditingPrescriptionId(null);
      setFormState(createEmptyForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save prescription.",
      );
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    setActionError(null);
    try {
      await deletePrescriptionMutation.mutateAsync(prescriptionId);
      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete prescription.",
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading prescriptions..."
                : "Manage patient prescriptions and medications"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Prescription" : "Create Prescription"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update prescription details and medications."
                    : "Create a new prescription for an appointment."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Patient</Label>
                    <Select
                      value={formState.patientId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          patientId: value,
                          appointmentId:
                            prev.appointmentId &&
                            appointmentById.get(prev.appointmentId)?.patientId === value
                              ? prev.appointmentId
                              : "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            patientsLoading ? "Loading patients..." : "Select patient"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Doctor</Label>
                    <Select
                      value={formState.doctorId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          doctorId: value,
                          appointmentId:
                            prev.appointmentId &&
                            appointmentById.get(prev.appointmentId)?.doctorId === value
                              ? prev.appointmentId
                              : "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            doctorsLoading ? "Loading doctors..." : "Select doctor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label>Appointment</Label>
                    <Select
                      value={formState.appointmentId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => {
                          const appointment = appointmentById.get(value);
                          return {
                            ...prev,
                            appointmentId: value,
                            patientId: appointment?.patientId ?? prev.patientId,
                            doctorId: appointment?.doctorId ?? prev.doctorId,
                          };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            appointmentsLoading
                              ? "Loading appointments..."
                              : "Select appointment"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentOptions.map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.patientName} - {appointment.doctorName} ({appointment.date}{" "}
                            {appointment.time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formState.prescribedDate}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          prescribedDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={formState.notes}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Medications</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Medication
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formState.medications.map((medication, index) => (
                      <div key={`${index}-${medication.medicineId}`} className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <Select
                            value={medication.medicineId || undefined}
                            onValueChange={(value) =>
                              handleMedicationChange(index, "medicineId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  medicinesLoading ? "Loading..." : "Medicine"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {medicines.map((medicine) => (
                                <SelectItem key={medicine.id} value={medicine.id}>
                                  {medicine.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Dosage"
                            value={medication.dosage}
                            onChange={(e) =>
                              handleMedicationChange(index, "dosage", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Frequency"
                            value={medication.frequency}
                            onChange={(e) =>
                              handleMedicationChange(index, "frequency", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Duration"
                            value={medication.duration}
                            onChange={(e) =>
                              handleMedicationChange(index, "duration", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMedication(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Create Prescription"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Prescriptions</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading prescriptions..."
                    : `${filteredPrescriptions.length} prescriptions found`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isError && (
              <p className="mb-4 text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load prescriptions."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No prescriptions found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.patientName}</TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>{prescription.date}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prescription.medications.slice(0, 2).map((medication, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {medication.name}
                          </Badge>
                        ))}
                        {prescription.medications.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{prescription.medications.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[prescription.status]}>
                        {prescription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(prescription)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(prescription)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(prescription.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Prescription Details
              </DialogTitle>
              <DialogDescription>
                Complete prescription information
              </DialogDescription>
            </DialogHeader>
            {selectedPrescription && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient</Label>
                    <p className="font-medium">{selectedPrescription.patientName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prescribing Doctor</Label>
                    <p className="font-medium">{selectedPrescription.doctorName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedPrescription.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedPrescription.status]}>
                      {selectedPrescription.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-muted-foreground">Medications</Label>
                  <div className="divide-y rounded-lg border">
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{medication.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dosage:</span>
                          <p className="font-medium">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <p className="font-medium">{medication.frequency || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{medication.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedPrescription.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="font-medium">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
