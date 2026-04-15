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
  CheckCircle2,
  DollarSign,
  Trash2,
} from "lucide-react";
import type { Invoice } from "@/lib/types";
import {
  useCreateInvoice,
  useDeleteInvoice,
  useInvoiceServices,
  useInvoices,
  useUpdateInvoice,
} from "@/hooks/useInvoices";
import { usePatients } from "@/hooks/usePatients";

type InvoiceItemFormState = {
  serviceId: string;
  quantity: string;
};

type InvoiceFormState = {
  patientId: string;
  invoiceDate: string;
  status: Invoice["status"];
  items: InvoiceItemFormState[];
};

const createEmptyItem = (): InvoiceItemFormState => ({
  serviceId: "",
  quantity: "1",
});

const getToday = () => new Date().toISOString().slice(0, 10);

const createEmptyForm = (): InvoiceFormState => ({
  patientId: "",
  invoiceDate: getToday(),
  status: "pending",
  items: [createEmptyItem()],
});

const toFormState = (invoice: Invoice): InvoiceFormState => ({
  patientId: invoice.patientId,
  invoiceDate: invoice.date || getToday(),
  status: invoice.status === "cancelled" ? "pending" : invoice.status,
  items: [],
});

const statusColors: Record<Invoice["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const formatInvoiceRef = (id: string) => {
  const numeric = Number(id);
  if (Number.isNaN(numeric)) return id;
  return `INV-${String(numeric).padStart(4, "0")}`;
};

export default function Billing() {
  const { data: invoices = [], isLoading, isError, error } = useInvoices();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: services = [], isLoading: servicesLoading } = useInvoiceServices();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [formState, setFormState] = useState<InvoiceFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingInvoiceId !== null;
  const isSaving = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    const invoiceRef = formatInvoiceRef(inv.id).toLowerCase();
    const matchesSearch =
      inv.patientName.toLowerCase().includes(query) ||
      inv.id.toLowerCase().includes(query) ||
      invoiceRef.includes(query);
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleDelete = async (invoiceId: string) => {
    setActionError(null);
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete invoice.",
      );
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setActionError(null);
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        data: { status: "paid" },
      });

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: "paid",
              }
            : prev,
        );
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update payment status.",
      );
    }
  };

  const openAddDialog = () => {
    setEditingInvoiceId(null);
    setFormState(createEmptyForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setFormState(toFormState(invoice));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingInvoiceId(null);
      setFormState(createEmptyForm());
      setFormError(null);
    }
  };

  const addItemRow = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? [createEmptyItem()]
          : prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemFormState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formState.patientId || !formState.invoiceDate) {
      setFormError("Patient and invoice date are required.");
      return;
    }

    const normalizedItems = formState.items
      .filter((item) => item.serviceId && Number(item.quantity) > 0)
      .map((item) => ({
        serviceId: item.serviceId,
        quantity: Number(item.quantity),
      }));

    if (!isEditing && normalizedItems.length === 0) {
      setFormError("At least one valid invoice item is required.");
      return;
    }

    try {
      if (isEditing && editingInvoiceId) {
        await updateInvoiceMutation.mutateAsync({
          id: editingInvoiceId,
          data: {
            patientId: formState.patientId,
            invoiceDate: formState.invoiceDate,
            status: formState.status,
            items: normalizedItems.length > 0 ? normalizedItems : undefined,
          },
        });
      } else {
        await createInvoiceMutation.mutateAsync({
          patientId: formState.patientId,
          invoiceDate: formState.invoiceDate,
          status: formState.status,
          items: normalizedItems,
        });
      }

      setFormDialogOpen(false);
      setEditingInvoiceId(null);
      setFormState(createEmptyForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save invoice.");
    }
  };

  const totalRevenue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingAmount = invoices
    .filter((invoice) => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const overdueAmount = invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
            <p className="text-muted-foreground">
              {isLoading ? "Loading invoices..." : "Manage patient invoices and payments"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Invoice" : "Create New Invoice"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update invoice details. Add line items only if you want to replace current items."
                    : "Generate a new invoice for a patient."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="grid grid-cols-3 gap-4">
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
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Invoice Date</Label>
                    <Input
                      type="date"
                      value={formState.invoiceDate}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          invoiceDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          status: value as Invoice["status"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Invoice Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formState.items.map((item, index) => (
                      <div key={`${index}-${item.serviceId}`} className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <Select
                            value={item.serviceId || undefined}
                            onValueChange={(value) =>
                              handleItemChange(index, "serviceId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  servicesLoading
                                    ? "Loading services..."
                                    : "Select service"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} ({formatCurrency(service.price)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeItemRow(index)}
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
                      : "Create Invoice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">From paid invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(overdueAmount)}
              </div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading invoices..."
                    : `${filteredInvoices.length} invoices found`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isError && (
              <p className="mb-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load invoices."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{formatInvoiceRef(invoice.id)}</TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(invoice)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={invoice.status === "paid"}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {invoice.status === "paid" ? "Already Paid" : "Mark as Paid"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(invoice.id)}
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
                Invoice {selectedInvoice ? formatInvoiceRef(selectedInvoice.id) : ""}
              </DialogTitle>
              <DialogDescription>Invoice details and line items</DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient</Label>
                    <p className="font-medium">{selectedInvoice.patientName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedInvoice.status]}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Invoice Date</Label>
                    <p className="font-medium">{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Due Date</Label>
                    <p className="font-medium">{selectedInvoice.dueDate}</p>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-muted-foreground">Items</Label>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, idx) => (
                          <TableRow key={`${item.description}-${idx}`}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-52 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
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
