import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  useDoctorMedicalRecords,
  usePatientMedicalRecords,
} from "@/hooks/useMedicalRecords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, FileText } from "lucide-react";
import type { MedicalRecord } from "@/lib/types";

export default function MyRecords() {
  const { user, loading } = useAuth();
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient";
  const doctorRecordsQuery = useDoctorMedicalRecords(isDoctor);
  const patientRecordsQuery = usePatientMedicalRecords(isPatient);
  const records = useMemo(
    () => (isDoctor ? doctorRecordsQuery.data : patientRecordsQuery.data) ?? [],
    [doctorRecordsQuery.data, isDoctor, patientRecordsQuery.data],
  );
  const isLoading = isDoctor ? doctorRecordsQuery.isLoading : patientRecordsQuery.isLoading;
  const isError = isDoctor ? doctorRecordsQuery.isError : patientRecordsQuery.isError;
  const error = isDoctor ? doctorRecordsQuery.error : patientRecordsQuery.error;

  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const latestRecord = useMemo(() => records[0] ?? null, [records]);
  const diagnosisCount = useMemo(
    () => records.filter((record) => Boolean(record.diagnosis?.trim())).length,
    [records],
  );

  const handleView = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!isDoctor && !isPatient) {
    return (
      <MainLayout>
        <Card>
          <CardHeader>
            <CardTitle>My Records</CardTitle>
            <CardDescription>
              This page is available for doctor and patient accounts.
            </CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Medical Records</h1>
          <p className="text-muted-foreground">
            {isDoctor
              ? "Clinical records generated from your completed visits."
              : "Clinical records generated from your completed appointments."}
          </p>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading medical records...
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load medical records."}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Records
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{records.length}</div>
                  <p className="text-xs text-muted-foreground">Records linked to your appointments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Latest Visit
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{latestRecord?.date || "-"}</div>
                  <p className="text-xs text-muted-foreground">
                    {isDoctor
                      ? latestRecord?.patientName || "No completed visits yet"
                      : latestRecord?.doctorName || "No completed visits yet"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Diagnoses Logged
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{diagnosisCount}</div>
                  <p className="text-xs text-muted-foreground">Records with diagnosis details</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Record History</CardTitle>
                <CardDescription>{records.length} records found</CardDescription>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No medical records found.</p>
                ) : (
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div key={record.id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {isDoctor
                                ? record.patientName || "Unknown Patient"
                                : record.doctorName || "Unknown Doctor"}
                            </p>
                            <p className="text-sm text-muted-foreground">{record.date}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleView(record)}>
                            View
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Diagnosis: {record.diagnosis || "Not provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Record Details
              </DialogTitle>
              <DialogDescription>Complete information for the selected record.</DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {isDoctor ? "Patient" : "Doctor"}
                    </Label>
                    <p className="font-medium">
                      {isDoctor ? selectedRecord.patientName : selectedRecord.doctorName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Visit Date</Label>
                    <p className="font-medium">{selectedRecord.date}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Diagnosis</Label>
                  <p className="font-medium">{selectedRecord.diagnosis || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Treatment</Label>
                  <p className="font-medium">{selectedRecord.treatment || "Not provided"}</p>
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
