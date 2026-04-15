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
import type { Department } from "@/lib/types";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/hooks/useDepartments";

type DepartmentFormState = {
  name: string;
  code: string;
  description: string;
};

const createEmptyDepartmentForm = (): DepartmentFormState => ({
  name: "",
  code: "",
  description: "",
});

const toFormState = (department: Department): DepartmentFormState => ({
  name: department.name,
  code: department.code ?? "",
  description: department.description,
});

export default function Departments() {
  const { data: departments = [], isLoading, isError, error } = useDepartments();
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(
    null,
  );
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
    null,
  );
  const [formState, setFormState] = useState<DepartmentFormState>(
    createEmptyDepartmentForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEditing = editingDepartmentId !== null;
  const isSaving =
    createDepartmentMutation.isPending || updateDepartmentMutation.isPending;

  const filteredDepartments = departments.filter((department) => {
    const query = searchQuery.toLowerCase();
    return (
      department.name.toLowerCase().includes(query) ||
      (department.code ?? "").toLowerCase().includes(query) ||
      department.description.toLowerCase().includes(query)
    );
  });

  const handleView = (department: Department) => {
    setSelectedDepartment(department);
    setViewDialogOpen(true);
  };

  const handleDelete = async (departmentId: string) => {
    setActionError(null);
    try {
      await deleteDepartmentMutation.mutateAsync(departmentId);
      if (selectedDepartment?.id === departmentId) {
        setSelectedDepartment(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete department.",
      );
    }
  };

  const openAddDialog = () => {
    setEditingDepartmentId(null);
    setFormState(createEmptyDepartmentForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartmentId(department.id);
    setFormState(toFormState(department));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingDepartmentId(null);
      setFormState(createEmptyDepartmentForm());
      setFormError(null);
    }
  };

  const handleSave = async () => {
    setFormError(null);

    if (!formState.name.trim() || !formState.code.trim()) {
      setFormError("Department name and code are required.");
      return;
    }

    const payload = {
      name: formState.name,
      code: formState.code,
      description: formState.description,
    };

    try {
      if (isEditing && editingDepartmentId) {
        await updateDepartmentMutation.mutateAsync({
          id: editingDepartmentId,
          data: payload,
        });
      } else {
        await createDepartmentMutation.mutateAsync(payload);
      }

      setFormDialogOpen(false);
      setEditingDepartmentId(null);
      setFormState(createEmptyDepartmentForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save department.",
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading departments..."
                : "Manage hospital departments and their staff"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Department" : "Add New Department"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update the department details and save your changes."
                    : "Create a new department in the hospital system."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter department name"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Department Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. CARD"
                    value={formState.code}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the department"
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
                      : "Add Department"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Departments</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading departments..."
                    : `${filteredDepartments.length} departments found`}
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
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
                  : "Failed to load departments."}
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
                  <TableHead>Staff</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.code || "-"}</TableCell>
                    <TableCell>{department.staffCount}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {department.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(department)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(department)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(department.id)}
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
              <DialogTitle>Department Details</DialogTitle>
              <DialogDescription>
                Complete information about the department
              </DialogDescription>
            </DialogHeader>
            {selectedDepartment && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Department Name</Label>
                  <p className="font-medium">{selectedDepartment.name}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Department Code</Label>
                  <p className="font-medium">{selectedDepartment.code || "-"}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Staff Count</Label>
                  <p className="font-medium">{selectedDepartment.staffCount}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">
                    {selectedDepartment.description || "No description"}
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
