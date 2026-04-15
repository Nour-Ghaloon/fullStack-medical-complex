import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useDoctorAppointmentComplete,
  useDoctorAppointmentReschedule,
  useDoctorAppointmentStatusUpdate,
  useDoctorAppointments,
} from "@/hooks/useAppointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock } from "lucide-react";
import type { Appointment } from "@/lib/types";

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "no-show": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const toDateKey = (value: string) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const parseTimeRange = (range: string) => {
  const parts = range.split("-").map((part) => part.trim());
  return {
    startTime: parts[0] ?? "",
    endTime: parts[1] ?? "",
  };
};

export default function DoctorAppointments() {
  const doctorAppointmentsQuery = useDoctorAppointments(true);
  const statusMutation = useDoctorAppointmentStatusUpdate();
  const rescheduleMutation = useDoctorAppointmentReschedule();
  const completeMutation = useDoctorAppointmentComplete();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    id: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [completeForm, setCompleteForm] = useState({
    id: "",
    diagnosis: "",
    notes: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const appointments = useMemo(() => doctorAppointmentsQuery.data ?? [], [doctorAppointmentsQuery.data]);
  const isLoading = doctorAppointmentsQuery.isLoading;
  const isError = doctorAppointmentsQuery.isError;
  const error = doctorAppointmentsQuery.error;

  const todayKey = new Date().toISOString().slice(0, 10);

  const { todayAppointments, upcomingAppointments } = useMemo(() => {
    const scheduled = appointments.filter((appointment) => appointment.status === "scheduled");
    return {
      todayAppointments: scheduled.filter((appointment) => toDateKey(appointment.date) === todayKey),
      upcomingAppointments: scheduled.filter((appointment) => toDateKey(appointment.date) > todayKey),
    };
  }, [appointments, todayKey]);

  const openViewDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDialogOpen(true);
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    const { startTime, endTime } = parseTimeRange(appointment.time);
    setRescheduleForm({
      id: appointment.id,
      date: toDateKey(appointment.date),
      startTime,
      endTime,
    });
    setActionError(null);
    setRescheduleDialogOpen(true);
  };

  const openCompleteDialog = (appointment: Appointment) => {
    setCompleteForm({
      id: appointment.id,
      diagnosis: "",
      notes: appointment.notes ?? "",
    });
    setActionError(null);
    setCompleteDialogOpen(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setActionError(null);
    try {
      await statusMutation.mutateAsync({ id: appointmentId, status: "cancelled" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    }
  };

  const handleReschedule = async () => {
    setActionError(null);
    if (!rescheduleForm.date || !rescheduleForm.startTime || !rescheduleForm.endTime) {
      setActionError("Date, start time, and end time are required.");
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        id: rescheduleForm.id,
        data: {
          date: rescheduleForm.date,
          startTime: rescheduleForm.startTime,
          endTime: rescheduleForm.endTime,
        },
      });
      setRescheduleDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reschedule appointment.");
    }
  };

  const handleComplete = async () => {
    setActionError(null);
    if (!completeForm.diagnosis.trim()) {
      setActionError("Diagnosis is required to complete an appointment.");
      return;
    }

    try {
      await completeMutation.mutateAsync({
        id: completeForm.id,
        data: {
          diagnosis: completeForm.diagnosis.trim(),
          notes: completeForm.notes.trim() || null,
        },
      });
      setCompleteDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to complete appointment.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">Live data from doctor appointment endpoints.</p>
        </div>

        {actionError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{actionError}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading appointments...
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load appointments."}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today
                </CardTitle>
                <CardDescription>{todayAppointments.length} scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No appointments scheduled today.</p>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{appointment.patientName || "Unknown Patient"}</p>
                            <p className="text-sm text-muted-foreground">{appointment.date}</p>
                            <p className="text-sm text-muted-foreground">{appointment.time || "TBD"}</p>
                          </div>
                          <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(appointment)}>
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleDialog(appointment)}
                          >
                            Reschedule
                          </Button>
                          <Button size="sm" onClick={() => openCompleteDialog(appointment)}>
                            Complete
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={statusMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming
                </CardTitle>
                <CardDescription>{upcomingAppointments.length} future appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No upcoming appointments.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{appointment.patientName || "Unknown Patient"}</p>
                            <p className="text-sm text-muted-foreground">{appointment.date}</p>
                            <p className="text-sm text-muted-foreground">{appointment.time || "TBD"}</p>
                          </div>
                          <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(appointment)}>
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleDialog(appointment)}
                          >
                            Reschedule
                          </Button>
                          <Button size="sm" onClick={() => openCompleteDialog(appointment)}>
                            Complete
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={statusMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>Visit information for the selected appointment.</DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="grid gap-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedAppointment.patientName || "Unknown Patient"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Time</Label>
                    <p className="font-medium">{selectedAppointment.time || "TBD"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedAppointment.status]}>
                    {selectedAppointment.status}
                  </Badge>
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

        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>Choose the new date and time for this visit.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(event) =>
                    setRescheduleForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={rescheduleForm.startTime}
                    onChange={(event) =>
                      setRescheduleForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={rescheduleForm.endTime}
                    onChange={(event) =>
                      setRescheduleForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReschedule} disabled={rescheduleMutation.isPending}>
                {rescheduleMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Appointment</DialogTitle>
              <DialogDescription>
                Add diagnosis and notes before marking this appointment as completed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Diagnosis</Label>
                <Textarea
                  value={completeForm.diagnosis}
                  onChange={(event) =>
                    setCompleteForm((prev) => ({ ...prev, diagnosis: event.target.value }))
                  }
                  placeholder="Enter diagnosis"
                />
              </div>
              <div className="grid gap-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={completeForm.notes}
                  onChange={(event) =>
                    setCompleteForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Consultation notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleComplete} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? "Saving..." : "Complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
