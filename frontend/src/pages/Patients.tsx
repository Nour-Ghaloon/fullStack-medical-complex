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
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import type { Patient } from "@/lib/types";
import {
  useCreatePatient,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from "@/hooks/usePatients";
import { useUsers } from "@/hooks/useUsers";

type PatientFormState = {
  userId: string;
  phone: string;
  dateOfBirth: string;
  gender: Patient["gender"] | "";
  address: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  medicalHistory: string;
  status: Patient["status"];
};

const createEmptyPatientForm = (): PatientFormState => ({
  userId: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  bloodType: "",
  allergies: "",
  chronicDiseases: "",
  medicalHistory: "",
  status: "active",
});

const toFormState = (patient: Patient): PatientFormState => ({
  userId: "",
  phone: patient.phone,
  dateOfBirth: patient.dateOfBirth,
  gender: patient.gender,
  address: patient.address,
  bloodType: patient.bloodType ?? "",
  allergies: patient.allergies ?? "",
  chronicDiseases: patient.chronicDiseases ?? "",
  medicalHistory: patient.medicalHistory ?? "",
  status: patient.status,
});
export default function Patients() {
  const { data: patients = [], isLoading, isError, error } = usePatients();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PatientFormState>(createEmptyPatientForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingPatientId !== null;
  const isSaving =
    createPatientMutation.isPending || updatePatientMutation.isPending;

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      (patient.allergies ?? "").toLowerCase().includes(query) ||
      (patient.chronicDiseases ?? "").toLowerCase().includes(query) ||
      (patient.medicalHistory ?? "").toLowerCase().includes(query)
    );
  });

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewDialogOpen(true);
  };

  const handleDelete = async (patientId: string) => {
    setActionError(null);
    try {
      await deletePatientMutation.mutateAsync(patientId);
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete patient.",
      );
    }
  };

  const openAddDialog = () => {
    setEditingPatientId(null);
    setFormState(createEmptyPatientForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setFormState(toFormState(patient));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingPatientId(null);
      setFormState(createEmptyPatientForm());
      setFormError(null);
    }
  };

  const handleEditFromView = () => {
    if (!selectedPatient) return;
    setViewDialogOpen(false);
    openEditDialog(selectedPatient);
  };

  const handleSave = async () => {
    setFormError(null);

    if (!formState.dateOfBirth || !formState.gender) {
      setFormError("Date of birth and gender are required.");
      return;
    }

    const basePayload = {
      dateOfBirth: formState.dateOfBirth,
      gender: formState.gender,
      phone: formState.phone.trim() || null,
      address: formState.address.trim() || null,
      bloodType: formState.bloodType.trim() || null,
      allergies: formState.allergies.trim() || null,
      chronicDiseases: formState.chronicDiseases.trim() || null,
      medicalHistory: formState.medicalHistory.trim() || null,
      status: formState.status,
    };

    try {
      if (isEditing && editingPatientId) {
        await updatePatientMutation.mutateAsync({
          id: editingPatientId,
          data: basePayload,
        });
      } else {
        if (!formState.userId) {
          setFormError("User is required.");
          return;
        }
        await createPatientMutation.mutateAsync({
          userId: formState.userId,
          ...basePayload,
        });
      }

      setFormDialogOpen(false);
      setEditingPatientId(null);
      setFormState(createEmptyPatientForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save patient.",
      );
    }
  };
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading patients..."
                : "Manage patient records and information"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Patient" : "Add New Patient"}</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update the patient's information and save your changes."
                    : "Enter the patient's information to create a new record."}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto px-1">
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                {!isEditing && (
                  <div className="grid gap-2">
                    <Label htmlFor="user">User</Label>
                    <Select
                      value={formState.userId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, userId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            usersLoading ? "Loading users..." : "Select user"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {usersLoading && (
                          <SelectItem value="loading-user" disabled>
                            Loading users...
                          </SelectItem>
                        )}
                        {!usersLoading && users.length === 0 && (
                          <SelectItem value="empty-user" disabled>
                            No users found
                          </SelectItem>
                        )}
                        {users
                        ?.filter((user: any) => {
                            const role = user.role?.toString().toLowerCase().trim();
                            return role === "patient";
                         })
                         .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                            {user.email ? ` (${user.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+963 00000-0000"
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formState.dateOfBirth}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          dateOfBirth: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formState.gender || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          gender: value as PatientFormState["gender"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={formState.bloodType || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, bloodType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter full address"
                    value={formState.address}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Enter known allergies"
                    value={formState.allergies}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, allergies: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="chronicDiseases">Chronic Diseases</Label>
                  <Textarea
                    id="chronicDiseases"
                    placeholder="Enter chronic diseases"
                    value={formState.chronicDiseases}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        chronicDiseases: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    placeholder="Enter medical history"
                    value={formState.medicalHistory}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        medicalHistory: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: value as Patient["status"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Add Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Patients</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading patients..."
                    : `${filteredPatients.length} patients found`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
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
                {error instanceof Error ? error.message : "Failed to load patients."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Allergies</TableHead>
                  <TableHead>Chronic Diseases</TableHead>
                  <TableHead>Medical History</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone || "-"}</TableCell>
                    <TableCell>{patient.bloodType || "-"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {patient.allergies || "-"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {patient.chronicDiseases || "-"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {patient.medicalHistory || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={patient.status === "active" ? "default" : "secondary"}
                      >
                        {patient.status}
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
                          <DropdownMenuItem onClick={() => handleView(patient)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(patient)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(patient.id)}
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
              <DialogTitle>Patient Details</DialogTitle>
              <DialogDescription>
                Complete information about the patient
              </DialogDescription>
            </DialogHeader>
            {selectedPatient && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedPatient.email || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedPatient.phone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{selectedPatient.dateOfBirth}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Blood Type</Label>
                    <p className="font-medium">
                      {selectedPatient.bloodType || "Not specified"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedPatient.address || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Allergies</Label>
                  <p className="font-medium whitespace-pre-wrap">
                    {selectedPatient.allergies || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Chronic Diseases</Label>
                  <p className="font-medium whitespace-pre-wrap">
                    {selectedPatient.chronicDiseases || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Medical History</Label>
                  <p className="font-medium whitespace-pre-wrap">
                    {selectedPatient.medicalHistory || "Not specified"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge
                      variant={selectedPatient.status === "active" ? "default" : "secondary"}
                    >
                      {selectedPatient.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Registered</Label>
                    <p className="font-medium">{selectedPatient.createdAt || "-"}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedPatient && (
                <Button type="button" onClick={handleEditFromView}>
                  Edit Patient
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
