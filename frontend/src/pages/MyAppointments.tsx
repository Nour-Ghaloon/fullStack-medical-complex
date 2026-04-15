import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, X, Check } from "lucide-react";
import type { Appointment } from "@/lib/types";

const statusColors: Record<Appointment["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "no-show": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const myAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "me",
    patientName: "Me",
    doctorId: "1",
    doctorName: "Dr. Robert Smith",
    date: "2024-02-15",
    time: "10:00 AM",
    type: "General Checkup",
    status: "scheduled",
    notes: "Annual physical examination",
  },
  {
    id: "2",
    patientId: "me",
    patientName: "Me",
    doctorId: "2",
    doctorName: "Dr. Emily Johnson",
    date: "2024-02-22",
    time: "2:00 PM",
    type: "Follow-up",
    status: "scheduled",
  },
  {
    id: "3",
    patientId: "me",
    patientName: "Me",
    doctorId: "3",
    doctorName: "Dr. David Williams",
    date: "2024-02-05",
    time: "11:00 AM",
    type: "Consultation",
    status: "completed",
  },
  {
    id: "4",
    patientId: "me",
    patientName: "Me",
    doctorId: "1",
    doctorName: "Dr. Robert Smith",
    date: "2024-01-20",
    time: "9:00 AM",
    type: "General Checkup",
    status: "completed",
  },
  {
    id: "5",
    patientId: "me",
    patientName: "Me",
    doctorId: "4",
    doctorName: "Dr. Lisa Anderson",
    date: "2024-01-10",
    time: "3:30 PM",
    type: "Consultation",
    status: "cancelled",
  },
];

export default function MyAppointments() {
  const [appointments] = useState<Appointment[]>(myAppointments);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "scheduled"
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
            <p className="text-muted-foreground">
              View and manage your scheduled appointments
            </p>
          </div>
          <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
            <Button onClick={() => setBookDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
                <DialogDescription>
                  Schedule a new appointment with a doctor.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Doctor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Dr. Robert Smith - Cardiology</SelectItem>
                      <SelectItem value="2">Dr. Emily Johnson - Neurology</SelectItem>
                      <SelectItem value="3">Dr. David Williams - General</SelectItem>
                      <SelectItem value="4">Dr. Lisa Anderson - Pediatrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Appointment Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkup">General Checkup</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes (Optional)</Label>
                  <Input placeholder="Reason for visit or any notes" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBookDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setBookDialogOpen(false)}>Book Appointment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              {upcomingAppointments.length} appointments scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming appointments scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(apt)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{apt.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.doctorName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{apt.date}</p>
                      <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {apt.time}
                      </p>
                    </div>
                    <Badge className={statusColors[apt.status]}>
                      {apt.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>
              Your appointment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No past appointments
              </p>
            ) : (
              <div className="space-y-3">
                {pastAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(apt)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{apt.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.doctorName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{apt.date}</p>
                      <p className="text-sm text-muted-foreground">{apt.time}</p>
                    </div>
                    <Badge className={statusColors[apt.status]}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                View appointment information
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium">{selectedAppointment.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedAppointment.status]}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{selectedAppointment.doctorName}</p>
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
