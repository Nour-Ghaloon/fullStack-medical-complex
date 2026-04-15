import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePatientPrescriptions, usePrescriptions ,
  useDeletePrescription ,
  usePrescriptionMedicines ,
  useCreatePrescription,
  useUpdatePrescription
} from "@/hooks/usePrescriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pill, CheckCircle, AlertCircle, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Prescription } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";
import { Select, SelectContent, SelectTrigger } from "@radix-ui/react-select";
import { SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


const statusColors: Record<Prescription["status"], string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function MyPrescriptions() {
  const { user, loading } = useAuth();
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient";

  // هذه أمثلة لهوكس يفترض وجودها في مشروعك
const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
const { data: medicines = [], isLoading: medicinesLoading } = usePrescriptionMedicines();
const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();


  const [createDialogOpen, setCreateDialogOpen] = useState(false); // أضفنا هذا السطر

  // تأكد من استيراد useDeletePrescription من ملف الهوكس الخاص بك
  const { mutate: deletePrescription } = useDeletePrescription(); 
const handleDelete = async (id: string | number) => {
  if (confirm("Are you sure?")) {
    // نقوم بالتحويل هنا لضمان أن الهوك يستلم رقماً
    deletePrescription(Number(id), {
      onSuccess: () => {
        toast.success("Prescription deleted successfully");
        doctorPrescriptionsQuery.refetch();
      },
    });
  }
};
const createPrescriptionMutation = useCreatePrescription();
const updatePrescriptionMutation = useUpdatePrescription();
  const doctorPrescriptionsQuery = usePrescriptions(isDoctor);
  const patientPrescriptionsQuery = usePatientPrescriptions(isPatient);
  const prescriptions = useMemo(
    () => (isDoctor ? doctorPrescriptionsQuery.data : patientPrescriptionsQuery.data) ?? [],
    [doctorPrescriptionsQuery.data, isDoctor, patientPrescriptionsQuery.data],
  );
   const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(
      null,
    );
  const isLoading = isDoctor ? doctorPrescriptionsQuery.isLoading : patientPrescriptionsQuery.isLoading;
  const isError = isDoctor ? doctorPrescriptionsQuery.isError : patientPrescriptionsQuery.isError;
  const error = isDoctor ? doctorPrescriptionsQuery.error : patientPrescriptionsQuery.error;
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const activePrescriptions = useMemo(
    () => prescriptions.filter((prescription) => prescription.status === "active"),
    [prescriptions],
  );

  const [formState, setFormState] = useState({
  patientId: "",
  doctorId: user?.id || "", // تعيين الطبيب الحالي تلقائياً
  appointmentId: "",
  prescribedDate: new Date().toISOString().split('T')[0], // تاريخ اليوم كقيمة افتراضية
  notes: "",
  medications: [{ medicineId: "", dosage: "", frequency: "", duration: "" }]
});

const [formError, setFormError] = useState<string | null>(null);
const addMedication = () => {
  setFormState(prev => ({
    ...prev,
    medications: [...prev.medications, { medicineId: "", dosage: "", frequency: "", duration: "" }]
  }));
};

const removeMedication = (index: number) => {
  setFormState(prev => ({
    ...prev,
    medications: prev.medications.filter((_, i) => i !== index)
  }));
};

const handleMedicationChange = (index: number, field: string, value: string) => {
  const newMedications = [...formState.medications];
  newMedications[index] = { ...newMedications[index], [field]: value };
  setFormState(prev => ({ ...prev, medications: newMedications }));
};

// تحويل المواعيد لـ Map لسهولة البحث عن المريض والطبيب المرتبط بالمعد
const appointmentById = useMemo(() => new Map(appointments.map(a => [a.id, a])), [appointments]);

const appointmentOptions = useMemo(() => {
  return appointments.filter(a => !formState.patientId || a.patientId === formState.patientId);
}, [appointments, formState.patientId]);

  const completedPrescriptions = useMemo(
    () => prescriptions.filter((prescription) => prescription.status === "completed"),
    [prescriptions],
  );

  const cancelledPrescriptions = useMemo(
    () => prescriptions.filter((prescription) => prescription.status === "cancelled"),
    [prescriptions],
  );

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setViewDialogOpen(true);
  };

 const handleSave = async () => {
  try {
    // 1. تجميع البيانات من الـ State اللي عندك
    const payload = {
      appointmentId: formState.appointmentId,
      prescribedDate: formState.prescribedDate,
      notes: formState.notes,
      medications: formState.medications,
    };

    // 2. استخدام الميوتيشن الجاهزة (هي لحالها بتعرف التوكن والروابط)
    if (editingPrescriptionId) {
      await updatePrescriptionMutation.mutateAsync({ 
        id: editingPrescriptionId, 
        data: payload 
      });
      toast.success("تم التعديل بنجاح");
    } else {
      await createPrescriptionMutation.mutateAsync(payload);
      toast.success("تمت الإضافة بنجاح");
    }

    setCreateDialogOpen(false); // إغلاق المودل
  } catch (err) {
    console.error(err);
    toast.error("حدث خطأ أثناء الحفظ");
  }
};
  
  const handleEdit = (prescription: Prescription) => {
  // 1. تخزين الـ ID لنعرف أننا نعدل (هذا سيجعل الـ handleSave يختار مسار الـ Update)
  setEditingPrescriptionId(prescription.id); 

  // 2. تعبئة الفورم ببيانات الوصفة المختارة (عشان ما تفتح الفورم فاضي)
  setFormState({
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    appointmentId: prescription.appointmentId ?? "",
    prescribedDate: prescription.date || new Date().toISOString().slice(0, 10),
    notes: prescription.notes ?? "",
    medications: prescription.medications.map((med) => ({
      medicineId: med.medicineId ?? "",
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
    })),
  });

  // 3. فتح المودال
  setCreateDialogOpen(true);
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
        <Card><CardContent className="py-10 text-center">Please login to view prescriptions.</CardContent></Card>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
           <h1 className="text-3xl font-bold tracking-tight">My Prescriptions</h1>
           <p className="text-muted-foreground">
              {isDoctor
              ? "Prescriptions issued for your appointments."
              : "Prescriptions issued for your treatment plan."}
           </p>
         </div>
          {isDoctor && (
            <Button onClick={() => {
              setSelectedPrescription(null); // تصفير الاختيار عند الإضافة الجديدة
              setCreateDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" /> New Prescription
            </Button>
          )}
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading prescriptions...
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load prescriptions."}
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
                    Active
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activePrescriptions.length}</div>
                  <p className="text-xs text-muted-foreground">Currently active prescriptions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                  <Pill className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedPrescriptions.length}</div>
                  <p className="text-xs text-muted-foreground">Completed prescriptions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cancelled
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cancelledPrescriptions.length}</div>
                  <p className="text-xs text-muted-foreground">Cancelled prescriptions</p>
                </CardContent>
              </Card>
            </div>
<div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prescription List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="flex items-center gap-3 rounded-lg border p-4">
                  <div className="flex-1">
                    <p className="font-medium">{isDoctor ? prescription.patientName : prescription.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{prescription.date} - {prescription.medications.length} meds</p>
                  </div>
                  
                  <Badge className={statusColors[prescription.status]}>{prescription.status}</Badge>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(prescription)}>
                      View
                    </Button>
                    
                    {isDoctor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(prescription)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(prescription.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog العرض (View) */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
           {/* محتوى الـ View السابق */}
        </Dialog>

        {/* --- هنا يجب أن تضيف Dialog الإضافة/التعديل الجديد --- */}
        {/* Dialog الإضافة والتعديل */}
         <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
    
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        {selectedPrescription ? "Edit Prescription" : "New Prescription"}
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6 py-4">

      {formError && (
        <p className="text-sm font-medium text-red-500 bg-red-100 p-3 rounded-lg">
          {formError}
        </p>
      )}

      {/* Patient */}
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
          <SelectTrigger className="w-full border rounded-lg px-3 py-2">
            <SelectValue
              placeholder={
                patientsLoading ? "Loading patients..." : "Select patient"
              }
            />
          </SelectTrigger>

          <SelectContent className="z-[9999] mt-2 rounded-lg border border-gray-700 bg-[#0f172a] shadow-xl">
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointment + Date */}
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
            <SelectTrigger className="w-full border rounded-lg px-3 py-2">
              <SelectValue 
                placeholder={
                  appointmentsLoading
                    ? "Loading appointments..."
                    : "Select appointment"
                }
              />
            </SelectTrigger>

            <SelectContent className="z-[9999] mt-2 rounded-lg border border-gray-700 bg-[#0f172a] shadow-xl" >
              {appointmentOptions.map((appointment) => (
                <SelectItem key={appointment.id} value={appointment.id}  className="cursor-pointer px-3 py-2 rounded-md text-sm hover:bg-blue-500/20 focus:bg-blue-500/30" >
                  {appointment.patientName} - {appointment.doctorName} (
                  {appointment.date} {appointment.time})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Date</Label>
          <Input
            type="date"
            className="rounded-lg"
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

      {/* Notes */}
      <div className="grid gap-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          className="rounded-lg min-h-[100px]"
          placeholder="Additional notes..."
          value={formState.notes}
          onChange={(e) =>
            setFormState((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      {/* Medications */}
      <div className="rounded-xl border p-5  space-y-4">
        
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Medications</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMedication}
            className="rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {formState.medications.map((medication, index) => (
            <div
              key={`${index}-${medication.medicineId}`}
              className="grid grid-cols-12 gap-3 items-center"
            >
              
              <div className="col-span-3">
                <Select
                  value={medication.medicineId || undefined}
                  onValueChange={(value) =>
                    handleMedicationChange(index, "medicineId", value)
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue
                      placeholder={
                        medicinesLoading ? "Loading..." : "Medicine"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent className="z-[9999] mt-2 rounded-lg border border-gray-700 bg-[#0f172a] shadow-xl" >
                    {medicines.map((medicine) => (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        {medicine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                className="col-span-2 rounded-lg"
                placeholder="Dosage"
                value={medication.dosage}
                onChange={(e) =>
                  handleMedicationChange(index, "dosage", e.target.value)
                }
              />

              <Input
                className="col-span-3 rounded-lg"
                placeholder="Frequency"
                value={medication.frequency}
                onChange={(e) =>
                  handleMedicationChange(index, "frequency", e.target.value)
                }
              />

              <Input
                className="col-span-3 rounded-lg"
                placeholder="Duration"
                value={medication.duration}
                onChange={(e) =>
                  handleMedicationChange(index, "duration", e.target.value)
                }
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeMedication(index)}
                className="col-span-1 rounded-lg"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>

    <DialogFooter className="mt-4 flex justify-between">
      <Button
        variant="ghost"
        onClick={() => setCreateDialogOpen(false)}
      >
        Cancel
      </Button>

      <Button
        className="px-6 rounded-lg"
        disabled={
          createPrescriptionMutation.isPending ||
          updatePrescriptionMutation.isPending
        }
        onClick={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {editingPrescriptionId ? "Update" : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
        {/* <CreatePrescriptionDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} initialData={selectedPrescription} /> */}
      </div>   </>)}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Prescription Details
              </DialogTitle>
              <DialogDescription>Complete prescription information.</DialogDescription>
            </DialogHeader>
            {selectedPrescription && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {isDoctor ? "Patient" : "Doctor"}
                    </Label>
                    <p className="font-medium">
                      {isDoctor
                        ? selectedPrescription.patientName
                        : selectedPrescription.doctorName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedPrescription.date}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedPrescription.status]}>
                    {selectedPrescription.status}
                  </Badge>
                </div>
                <div>
                  <Label className="mb-2 block text-muted-foreground">Medications</Label>
                  <div className="divide-y rounded-lg border">
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={`${medication.name}-${index}`} className="grid grid-cols-4 gap-2 p-3 text-sm">
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
