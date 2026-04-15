import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useCancelPatientAppointment,
  useCreatePatientAppointment,
  usePatientAppointments,
  usePatientDoctorAvailability,
  usePatientDoctors,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Appointment } from "@/lib/types";

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "no-show": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const toDateKey = (value: string) => (value.includes("T") ? value.split("T")[0] : value);
const todayKey = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ doctorId: "", date: todayKey(), startTime: "", endTime: "", notes: "" });

export default function PatientAppointments() {
  const appointmentsQuery = usePatientAppointments(true);
  const doctorsQuery = usePatientDoctors(true);
  const createMutation = useCreatePatientAppointment();
  const cancelMutation = useCancelPatientAppointment();

  const [viewItem, setViewItem] = useState<Appointment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const availabilityQuery = usePatientDoctorAvailability(
    form.doctorId || undefined,
    form.date || undefined,
    formOpen,
  );

  const appointments = useMemo(
    () => (appointmentsQuery.data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [appointmentsQuery.data],
  );

  const openView = (appointment: Appointment) => {
    setViewItem(appointment);
    setViewOpen(true);
  };

  const submitBooking = async () => {
    setError(null);
    if (!form.doctorId || !form.date || !form.startTime || !form.endTime) {
      setError("Doctor, date, start time, and end time are required.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setError("End time must be after start time.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        doctorId: form.doctorId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes.trim() || null,
      });
      setFormOpen(false);
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment.");
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    setError(null);
    try {
      await cancelMutation.mutateAsync(appointmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
            <p className="text-muted-foreground">Book and manage your appointments.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Appointment History</CardTitle>
            <CardDescription>{appointments.length} appointments found</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading appointments...</p>
            ) : appointmentsQuery.isError ? (
              <p className="py-8 text-center text-destructive">
                {appointmentsQuery.error instanceof Error
                  ? appointmentsQuery.error.message
                  : "Failed to load appointments."}
              </p>
            ) : appointments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No appointments found.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((item) => {
                  const canCancel = item.status === "scheduled" && toDateKey(item.date) >= todayKey();
                  return (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.doctorName || "Unknown Doctor"}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                          <p className="text-sm text-muted-foreground">{item.time || "TBD"}</p>
                        </div>
                        <Badge className={statusColors[item.status]}>{item.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openView(item)}>
                          View
                        </Button>
                        {canCancel && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelAppointment(item.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>Choose doctor, date, and time for your visit.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Doctor</Label>
                <Select value={form.doctorId || undefined} onValueChange={(v) => setForm((p) => ({ ...p, doctorId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={doctorsQuery.isLoading ? "Loading doctors..." : "Select doctor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(doctorsQuery.data ?? []).map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>End Time</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes (Optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              {form.doctorId && form.date && (
                <p className="text-xs text-muted-foreground">
                  {availabilityQuery.isLoading
                    ? "Checking availability..."
                    : `Available slots: ${(availabilityQuery.data?.availableSlots ?? []).join(", ") || "none"}`}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={submitBooking} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Booking..." : "Book"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>Visit information for the selected appointment.</DialogDescription>
            </DialogHeader>
            {viewItem && (
              <div className="grid gap-4 py-4">
                <div><Label className="text-muted-foreground">Doctor</Label><p className="font-medium">{viewItem.doctorName}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Date</Label><p className="font-medium">{viewItem.date}</p></div>
                  <div><Label className="text-muted-foreground">Time</Label><p className="font-medium">{viewItem.time}</p></div>
                </div>
                <div><Label className="text-muted-foreground">Status</Label><Badge className={statusColors[viewItem.status]}>{viewItem.status}</Badge></div>
                {viewItem.notes && <div><Label className="text-muted-foreground">Notes</Label><p className="font-medium">{viewItem.notes}</p></div>}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
