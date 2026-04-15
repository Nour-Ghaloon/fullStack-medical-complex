import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  X,
  Check,
  Calendar,
  Trash2,
} from "lucide-react";
import type { Appointment } from "@/lib/types";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { apiRequest } from "@/lib/api";


type AppointmentFormState = {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
};

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "no-show": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateKey = (value: string) => {
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const parseTimeRange = (value: string) => {
  if (value.includes("-")) {
    const [start, end] = value.split("-").map((item) => item.trim());
    return {
      startTime: start?.slice(0, 5) ?? "",
      endTime: end?.slice(0, 5) ?? "",
    };
  }

  return {
    startTime: value.slice(0, 5),
    endTime: "",
  };
};

const createEmptyForm = (): AppointmentFormState => ({
  patientId: "",
  doctorId: "",
  date: toLocalDateKey(new Date()),
  startTime: "",
  endTime: "",
  notes: "",
});

const toFormState = (appointment: Appointment): AppointmentFormState => {
  const time = parseTimeRange(appointment.time);
  return {
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: toDateKey(appointment.date),
    startTime: time.startTime,
    endTime: time.endTime,
    notes: appointment.notes ?? "",
  };
};

export default function Appointments() {
  const { data: appointments = [], isLoading, error } = useAppointments();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AppointmentFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startTime, setStartTime] = useState("");

  const isEditing = editingAppointmentId !== null;
  const isSaving =
    createAppointmentMutation.isPending || updateAppointmentMutation.isPending;

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.name])),
    [patients],
  );
  const doctorNameById = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.id, doctor.name])),
    [doctors],
  );

  const isFallbackName = (value: string, label: "Patient" | "Doctor") =>
    !value || value.startsWith(`${label} #`);

  const getPatientName = (appointment: Appointment) => {
    if (!isFallbackName(appointment.patientName, "Patient")) {
      return appointment.patientName;
    }
    return patientNameById.get(appointment.patientId) ?? "Unknown Patient";
  };

  const getDoctorName = (appointment: Appointment) => {
    if (!isFallbackName(appointment.doctorName, "Doctor")) {
      return appointment.doctorName;
    }
    return doctorNameById.get(appointment.doctorId) ?? "Unknown Doctor";
  };

  const filteredAppointments = appointments.filter((apt) => {
    const query = searchQuery.toLowerCase();
    const patientName = getPatientName(apt).toLowerCase();
    const doctorName = getDoctorName(apt).toLowerCase();
    const matchesSearch =
      patientName.includes(query) ||
      doctorName.includes(query) ||
      apt.patientId.toLowerCase().includes(query) ||
      apt.doctorId.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddDialog = () => {
    setEditingAppointmentId(null);
    setFormState(createEmptyForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setFormState(toFormState(appointment));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingAppointmentId(null);
      setFormState(createEmptyForm());
      setFormError(null);
    }
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    setActionError(null);

    if (
      !formState.patientId ||
      !formState.doctorId ||
      !formState.date ||
      !formState.startTime
      // !formState.endTime
    ) {
      setFormError("Patient ID, Doctor ID, date, start time, and end time are required.");
      return;
    }

    // if (formState.endTime <= formState.startTime) {
    //   setFormError("End time must be after start time.");
    //   return;
    // }

    try {
      if (isEditing && editingAppointmentId) {
        await updateAppointmentMutation.mutateAsync({
          id: editingAppointmentId,
          data: {
            patientId: formState.patientId,
            doctorId: formState.doctorId,
            date: formState.date,
            startTime: formState.startTime,
            endTime: formState.endTime,
            notes: formState.notes.trim() || null,
          },
        });
      } else {
        await createAppointmentMutation.mutateAsync({
          patientId: formState.patientId,
          doctorId: formState.doctorId,
          date: formState.date,
          startTime: formState.startTime,
          endTime: formState.endTime,
          notes: formState.notes.trim() || null,
        });
      }

      setFormDialogOpen(false);
      setEditingAppointmentId(null);
      setFormState(createEmptyForm());
      setFormError(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save appointment.",
      );
    }
  };

  const handleMarkComplete = async (appointmentId: string) => {
    setActionError(null);
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: { status: "completed" },
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to mark appointment complete.",
      );
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setActionError(null);
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: { status: "cancelled" },
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel appointment.",
      );
    }
  };

  const handleDelete = async (appointmentId: string) => {
    setActionError(null);
    try {
      await deleteAppointmentMutation.mutateAsync(appointmentId);
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete appointment.",
      );
    }
  };

  const fetchSlots = async (doctorId: string, date: string) => {
  setLoadingSlots(true);
  try {
    // تجهيز الـ Query Parameters
    const params = new URLSearchParams({ date });

    // استدعاء الدالة بنمط مشروعك
    const response = await apiRequest<any>(
      `/doctors/${doctorId}/availability?${params.toString()}`
    );

    // ملاحظة: الـ apiRequest غالباً بترجع البيانات (data) مباشرة
    // فما في داعي نكتب response.data، جرب هيك:
    if (response && response.available_slots) {
      setAvailableSlots(response.available_slots);
    } else {
      setAvailableSlots([]);
    }
  } catch (error) {
    console.error("Error fetching slots:", error);
    setAvailableSlots([]);
  } finally {
    setLoadingSlots(false);
  }
};

  // مراقبة تغيير الدكتور أو التاريخ
  useEffect(() => {
    console.log("Doctor ID from State:", formState.doctorId);
  console.log("Date from State:", formState.date);

  if (formState.doctorId && formState.date) {
    console.log("Fetching slots now for:", formState.doctorId, "on", formState.date);
    fetchSlots(formState.doctorId, formState.date);
  }
}, [formState.doctorId, formState.date]);

  const todayKey = toLocalDateKey(new Date());
  const todayAppointments = appointments.filter(
    (apt) => toDateKey(apt.date) === todayKey && apt.status === "scheduled",
  );

  const tableStatusText = isLoading
    ? "Loading appointments..."
    : error instanceof Error
      ? error.message
      : "No appointments found";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">
              Manage patient appointments and schedules
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Appointment" : "Schedule New Appointment"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update appointment details."
                    : "Create a new appointment."}
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
                        {patientsLoading && (
                          <SelectItem value="loading-patient" disabled>
                            Loading patients...
                          </SelectItem>
                        )}
                        {!patientsLoading && patients.length === 0 && (
                          <SelectItem value="empty-patient" disabled>
                            No patients found
                          </SelectItem>
                        )}
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
                      value={formState.doctorId || ""}
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
                        {doctorsLoading && (
                          <SelectItem value="loading-doctor" disabled>
                            Loading doctors...
                          </SelectItem>
                        )}
                        {!doctorsLoading && doctors.length === 0 && (
                          <SelectItem value="empty-doctor" disabled>
                            No doctors found
                          </SelectItem>
                        )}
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formState.startTime}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </div>
                  {/* <div className="grid gap-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formState.endTime}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </div> */}
                  <div className="space-y-2">
                  <label className="text-sm font-medium">Available Slots</label>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground">Loading slots...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={startTime === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStartTime(slot)}
                          className="w-full"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">No slots available for this selection.</p>
                  )}
                </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes (Optional)</Label>
                  <Input
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
                  {isSaving
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="today">Today's Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Appointments</CardTitle>
                    <CardDescription>
                      {isLoading ? "Loading..." : `${filteredAppointments.length} appointments found`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative w-72">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search appointments..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {actionError && (
                  <p className="mb-4 text-sm text-destructive">{actionError}</p>
                )}
                <Table>
                  <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {tableStatusText}
                    </TableCell>
                  </TableRow>
                ) : (
                      filteredAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{getPatientName(apt)}</TableCell>
                          <TableCell>{getDoctorName(apt)}</TableCell>
                          <TableCell>
                            {apt.date} at {apt.time}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(apt)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(apt)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMarkComplete(apt.id)}
                                  disabled={apt.status !== "scheduled"}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCancel(apt.id)}
                                  disabled={apt.status !== "scheduled"}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(apt.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Queue
                </CardTitle>
                <CardDescription>
                  {isLoading ? "Loading..." : `${todayAppointments.length} appointments scheduled for today`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="py-8 text-center text-muted-foreground">Loading appointments...</p>
                ) : error ? (
                  <p className="py-8 text-center text-destructive">
                    {error instanceof Error ? error.message : "Failed to load appointments"}
                  </p>
                ) : todayAppointments.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No appointments scheduled for today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{getPatientName(apt)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getDoctorName(apt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{apt.time}</p>
                          <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                Complete information about the appointment
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient</Label>
                    <p className="font-medium">{getPatientName(selectedAppointment)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Doctor</Label>
                    <p className="font-medium">{getDoctorName(selectedAppointment)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient ID</Label>
                    <p className="font-medium">{selectedAppointment.patientId}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Doctor ID</Label>
                    <p className="font-medium">{selectedAppointment.doctorId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Time</Label>
                    <p className="font-medium">{selectedAppointment.time}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedAppointment.status]}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="font-medium">{selectedAppointment.notes}</p>
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
