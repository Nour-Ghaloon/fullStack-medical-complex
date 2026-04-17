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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import type { Service } from "@/lib/types";
import {
  useCreateService,
  useDeleteService,
  useDepartments,
  useServices,
  useUpdateService,
} from "@/hooks/useServices";

type ServiceFormState = {
  name: string;
  code: string;
  description: string;
  department_id: number; // أضيفي هذا السطر
  price: number;         // يفضل إضافته الآن أيضاً
  duration: number;
  status: "active" | "inactive";
};

const createEmptyServiceForm = (): ServiceFormState => ({
  name: "",
  code: "",
  description: "",
  department_id: 0, // قيمة افتراضية
  price: 0,
  duration: 0,
  status: "active",
});

const toFormState = (service: Service): ServiceFormState => ({
  name: service.name,
  code: service.code ?? "",
  description: service.description,
  department_id: service.department_id, // أضيفي هذا
  price: service.price,
  duration: service.duration,
  status: service.status,
});

export default function Services() {
  const { data: services = [], isLoading, isError, error } = useServices();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(
    null,
  );
  const [editingServiceId, setEditingServiceId] = useState<string | null>(
    null,
  );
  const { data: departments = [] } = useDepartments();
  const [formState, setFormState] = useState<ServiceFormState>(
    createEmptyServiceForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingServiceId !== null;
  const isSaving =
    createServiceMutation.isPending || updateServiceMutation.isPending;

  const filteredServices = services.filter((service) => {
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      (service.code ?? "").toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) 
    );
  });

  const handleView = (service: Service) => {
    setSelectedService(service);
    setViewDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    setActionError(null);
    try {
      await deleteServiceMutation.mutateAsync(serviceId);
      if (selectedService?.id === serviceId) {
        setSelectedService(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete service.",
      );
    }
  };

  const openAddDialog = () => {
    setEditingServiceId(null);
    setFormState(createEmptyServiceForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingServiceId(service.id);
    setFormState(toFormState(service));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingServiceId(null);
      setFormState(createEmptyServiceForm());
      setFormError(null);
    }
  };

  const handleSave = async () => {
    setFormError(null);

    if (!formState.name.trim() || !formState.code.trim()) {
      setFormError("Service name and code are required.");
      return;
    }

    const payload = {
      name: formState.name,
      code: formState.code,
      description: formState.description,
      department_id: formState.department_id, 
      price: formState.price,               
      duration: formState.duration,         
      status: formState.status,
    };

    try {
      if (isEditing && editingServiceId) {
        await updateServiceMutation.mutateAsync({
          id: editingServiceId,
          data: payload,
        });
      } else {
        await createServiceMutation.mutateAsync(payload);
      }

      setFormDialogOpen(false);
      setEditingServiceId(null);
      setFormState(createEmptyServiceForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save service.",
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading services..."
                : "Manage hospital services and their details"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Service" : "Add New Service"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update the service details and save your changes."
                    : "Create a new service in the hospital system."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter Service name"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Service Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. CARD"
                    value={formState.code}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>

                {/* Department Select */}
                <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <select
                    id="department"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formState.department_id}
                    onChange={(e) => setFormState((prev) => ({ ...prev, department_id: Number(e.target.value) }))}
                >
                    <option value="">Select Department</option>
                    {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                        {dept.name}
                    </option>
                    ))}
                </select>
                </div>

                {/* Price & Duration in one row */}
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formState.price}
                    onChange={(e) => setFormState((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={formState.duration}
                    onChange={(e) => setFormState((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                    />
                </div>
                </div>

                {/* Status Select */}
                <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formState.status}
                    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the Service"
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
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
                      : "Add Service"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Services</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading services..."
                    : `${filteredServices.length} services found`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Services..."
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
                {error instanceof Error
                  ? error.message
                  : "Failed to load Services."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>price</TableHead>
                  <TableHead>duration</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.code || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.description || "-"}
                    </TableCell>
                    <TableCell>{service.department_name}</TableCell>
                    <TableCell>{service.price} $</TableCell>
                    <TableCell>{service.duration} min</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        service.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {service.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(service.id)}
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
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>
                Complete information about the Service
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
            <div className="grid gap-6 py-4">
                {/* Name & Code */}
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Service Name</Label>
                    <p className="font-semibold text-sm">{selectedService.name}</p>
                </div>
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Service Code</Label>
                    <p className="font-mono font-medium text-sm">{selectedService.code || "-"}</p>
                </div>
                </div>

                <hr className="border-border/50" />

                {/* Department & Status */}
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Department</Label>
                    <p className="font-medium text-sm">{selectedService.department_name || "N/A"}</p>
                </div>
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedService.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                        {selectedService.status}
                    </span>
                    </div>
                </div>
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Price</Label>
                    <p className="font-bold text-sm text-primary">{selectedService.price} $</p>
                </div>
                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs">Duration</Label>
                    <p className="font-medium text-sm">{selectedService.duration} Minutes</p>
                </div>
                </div>

                <hr className="border-border/50" />

                {/* Description */}
                <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm leading-relaxed text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/40">
                    {selectedService.description || "No description provided for this service."}
                </p>
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
