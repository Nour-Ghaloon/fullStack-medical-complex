import { useState } from "react";
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
  FileText,
  Trash2,
} from "lucide-react";
import type { MedicalRecord } from "@/lib/types";
import {
  useCreateMedicalRecord,
  useDeleteMedicalRecord,
  useMedicalRecords,
  useUpdateMedicalRecord,
} from "@/hooks/useMedicalRecords";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";

type MedicalRecordFormState = {
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const createEmptyForm = (): MedicalRecordFormState => ({
  patientId: "",
  doctorId: "",
  date: getToday(),
  diagnosis: "",
  treatment: "",
  notes: "",
});

const toFormState = (record: MedicalRecord): MedicalRecordFormState => ({
  patientId: record.patientId,
  doctorId: record.doctorId,
  date: record.date || getToday(),
  diagnosis: record.diagnosis,
  treatment: record.treatment,
  notes: record.notes ?? "",
});

export default function MedicalRecords() {
  const { data: records = [], isLoading, isError, error } = useMedicalRecords();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const createRecordMutation = useCreateMedicalRecord();
  const updateRecordMutation = useUpdateMedicalRecord();
  const deleteRecordMutation = useDeleteMedicalRecord();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MedicalRecordFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingRecordId !== null;
  const isSaving = createRecordMutation.isPending || updateRecordMutation.isPending;

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.patientName.toLowerCase().includes(query) ||
      record.doctorName.toLowerCase().includes(query) ||
      record.diagnosis.toLowerCase().includes(query)
    );
  });

  const handleView = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingRecordId(null);
    setFormState(createEmptyForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (record: MedicalRecord) => {
    setEditingRecordId(record.id);
    setFormState(toFormState(record));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingRecordId(null);
      setFormState(createEmptyForm());
      setFormError(null);
    }
  };

  const handleSave = async () => {
    setFormError(null);
    if (
      !formState.patientId ||
      // !formState.doctorId ||
      !formState.date ||
      !formState.diagnosis.trim() ||
      !formState.treatment.trim()
    ) {
      setFormError("Patient, doctor, date, diagnosis, and treatment are required.");
      return;
    }

    try {
      const payload = {
        patientId: formState.patientId,
        // doctorId: formState.doctorId,
        date: formState.date,
        diagnosis: formState.diagnosis,
        treatment: formState.treatment,
        notes: formState.notes.trim() || null,
      };

      if (isEditing && editingRecordId) {
        await updateRecordMutation.mutateAsync({
          id: editingRecordId,
          data: payload,
        });
      } else {
        await createRecordMutation.mutateAsync(payload);
      }

      setFormDialogOpen(false);
      setEditingRecordId(null);
      setFormState(createEmptyForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save medical record.",
      );
    }
  };

  const handleDelete = async (recordId: string) => {
    setActionError(null);
    try {
      await deleteRecordMutation.mutateAsync(recordId);
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete medical record.",
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading medical records..."
                : "View and manage patient medical records"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Medical Record" : "Add Medical Record"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update this patient's medical record."
                    : "Create a new medical record for a patient."}
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
                        setFormState((prev) => ({ ...prev, patientId: value }))
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
                        {patients
                         .map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div className="grid gap-2">
                    <Label>Doctor</Label>
                    <Select
                      value={formState.doctorId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, doctorId: value }))
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
                  </div> */}
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formState.date}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Diagnosis</Label>
                  <Input
                    placeholder="Enter diagnosis"
                    value={formState.diagnosis}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, diagnosis: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Treatment</Label>
                  <Textarea
                    placeholder="Enter treatment details"
                    value={formState.treatment}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, treatment: e.target.value }))
                    }
                  />
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Save Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Records</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading medical records..."
                    : `${filteredRecords.length} medical records found`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
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
                {error instanceof Error ? error.message : "Failed to load records."}
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
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No medical records found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.patientName}</TableCell>
                    <TableCell>{record.doctorName}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.diagnosis}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(record)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(record.id)}
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
                <FileText className="h-5 w-5" />
                Medical Record Details
              </DialogTitle>
              <DialogDescription>
                Complete medical record information
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient</Label>
                    <p className="font-medium">{selectedRecord.patientName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Doctor</Label>
                    <p className="font-medium">{selectedRecord.doctorName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedRecord.date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Diagnosis</Label>
                  <p className="font-medium">{selectedRecord.diagnosis}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Treatment</Label>
                  <p className="font-medium">{selectedRecord.treatment || "-"}</p>
                </div>
                {selectedRecord.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="font-medium">{selectedRecord.notes}</p>
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
