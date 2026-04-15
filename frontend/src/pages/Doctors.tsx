import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DoctorAvailability } from "./DoctorAvailability";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Clock } from "lucide-react";
import type { Doctor } from "@/lib/types";
import {
  useCreateDoctor,
  useDeleteDoctor,
  useDoctors,
  useUpdateDoctor,
} from "@/hooks/useDoctors";
import { useDepartments } from "@/hooks/useDepartments";
import { useUsers } from "@/hooks/useUsers";

type DoctorFormState = {
  userId: string;
  departmentId: string;
  specialization: string;
  hireDate: string;
  phone: string;
  address: string;
  bio: string;
  status: Doctor["status"];
};

const createEmptyDoctorForm = (): DoctorFormState => ({
  userId: "",
  departmentId: "",
  specialization: "",
  hireDate: "",
  phone: "",
  address: "",
  bio: "",
  status: "active",
});

const toFormState = (doctor: Doctor): DoctorFormState => ({
  userId: doctor.userId ?? "",
  departmentId: doctor.departmentId ?? "",
  specialization: doctor.specialty ?? "",
  hireDate: doctor.hireDate ?? "",
  phone: doctor.phone ?? "",
  address: doctor.address ?? "",
  bio: doctor.bio ?? "",
  status: doctor.status,
});

export default function Doctors() {
  const { data: fetchedDoctors = [], isLoading, isError, error } = useDoctors();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const createDoctorMutation = useCreateDoctor();
  const updateDoctorMutation = useUpdateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();
  const doctors = fetchedDoctors;
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [formState, setFormState] = useState<DoctorFormState>(createEmptyDoctorForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

// 3. دالة فتح مودال المواعيد
const openScheduleDialog = (doctor: Doctor) => {
  setSelectedDoctor(doctor);
  setIsScheduleDialogOpen(true);
};

  const isEditing = editingDoctorId !== null;
  const isSaving = createDoctorMutation.isPending || updateDoctorMutation.isPending;

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setViewDialogOpen(true);
  };

  const handleDelete = async (doctorId: string) => {
    setActionError(null);
    try {
      await deleteDoctorMutation.mutateAsync(doctorId);
      if (selectedDoctor?.id === doctorId) {
        setSelectedDoctor(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete doctor.",
      );
    }
  };

  const openAddDialog = () => {
    setEditingDoctorId(null);
    setFormState(createEmptyDoctorForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id);
    setFormState(toFormState(doctor));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingDoctorId(null);
      setFormState(createEmptyDoctorForm());
      setFormError(null);
    }
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formState.userId || !formState.departmentId || !formState.hireDate) {
      setFormError("User, department, and hire date are required.");
      return;
    }

    const basePayload = {
      departmentId: formState.departmentId,
      specialization: formState.specialization.trim() || null,
      hireDate: formState.hireDate,
      status: formState.status,
      phone: formState.phone.trim() || null,
      address: formState.address.trim() || null,
      bio: formState.bio.trim() || null,
    };

    try {
      if (isEditing && editingDoctorId) {
        await updateDoctorMutation.mutateAsync({
          id: editingDoctorId,
          data: basePayload,
        });
      } else {
        await createDoctorMutation.mutateAsync({
          userId: formState.userId,
          ...basePayload,
        });
      }

      setFormDialogOpen(false);
      setEditingDoctorId(null);
      setFormState(createEmptyDoctorForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save doctor.",
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .replace("Dr. ", "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading doctors..."
                : "Manage medical staff and their specializations"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update the doctor's information and save your changes."
                    : "Enter the doctor's information to add them to the system."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user">User</Label>
                    <Select
                      value={formState.userId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, userId: value }))
                      }
                      disabled={isEditing}
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
                          <SelectItem value="loading" disabled>
                            Loading users...
                          </SelectItem>
                        )}
                        {!usersLoading && users.length === 0 && (
                          <SelectItem value="empty" disabled>
                            No users found
                          </SelectItem>
                        )}
                        {users
                        ?.filter((user: any) => {
                            const role = user.role?.toString().toLowerCase().trim();
                            return role === "doctor";
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
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formState.departmentId || undefined}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, departmentId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            departmentsLoading
                              ? "Loading departments..."
                              : "Select department"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsLoading && (
                          <SelectItem value="loading-dept" disabled>
                            Loading departments...
                          </SelectItem>
                        )}
                        {!departmentsLoading && departments.length === 0 && (
                          <SelectItem value="empty-dept" disabled>
                            No departments found
                          </SelectItem>
                        )}
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g., Cardiology"
                      value={formState.specialization}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          specialization: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formState.hireDate}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          hireDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street, City"
                      value={formState.address}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, address: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Short bio"
                    value={formState.bio}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          status: value as Doctor["status"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On leave</SelectItem>
                      </SelectContent>
                    </Select>
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
                      : "Add Doctor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Manage Schedule : {selectedDoctor?.name}
                </DialogTitle>
              </DialogHeader>
              
              {/* استدعاء الكومبوننت الذي يمرر الـ ID للباك إند */}
              {selectedDoctor && (
                <DoctorAvailability doctorId={selectedDoctor.id} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Doctors</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading doctors..."
                    : `${filteredDoctors.length} doctors in the system`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
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
                {error instanceof Error ? error.message : "Failed to load doctors."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={doctor.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(doctor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{doctor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.department}</TableCell>
                    <TableCell>{doctor.hireDate || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={doctor.status === "active" ? "default" : "secondary"}
                      >
                        {doctor.status === "on_leave" ? "on leave" : doctor.status}
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
                          <DropdownMenuItem onClick={() => handleView(doctor)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(doctor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openScheduleDialog(doctor)}>
                           <Clock className="mr-2 h-4 w-4" />
                            <span>Manage Schedule</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(doctor.id)}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Doctor Details</DialogTitle>
              <DialogDescription>
                Complete information about the doctor
              </DialogDescription>
            </DialogHeader>
            {selectedDoctor && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedDoctor.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(selectedDoctor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-medium">{selectedDoctor.name}</p>
                    <p className="text-muted-foreground">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedDoctor.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedDoctor.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{selectedDoctor.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hire Date</Label>
                    <p className="font-medium">
                      {selectedDoctor.hireDate || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {selectedDoctor.address || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bio</Label>
                    <p className="font-medium">
                      {selectedDoctor.bio || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant={selectedDoctor.status === "active" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {selectedDoctor.status === "on_leave"
                      ? "on leave"
                      : selectedDoctor.status}
                  </Badge>
                </div>
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
