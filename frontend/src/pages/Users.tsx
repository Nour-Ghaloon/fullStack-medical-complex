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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Edit,
  Trash2,
  Shield,
  Stethoscope,
  UserCog,
} from "lucide-react";
import type { SystemUser } from "@/lib/types";
import {
  useCreateSystemUser,
  useDeleteSystemUser,
  useSystemUsers,
  useUpdateSystemUser,
} from "@/hooks/useUsers";

type UserFormState = {
  displayName: string;
  email: string;
  password: string;
  role: SystemUser["role"];
};

const createEmptyUserForm = (): UserFormState => ({
  displayName: "",
  email: "",
  password: "",
  role: "patient",
});

const toFormState = (user: SystemUser): UserFormState => ({
  displayName: user.displayName,
  email: user.email,
  password: "",
  role: user.role === "user" ? "patient" : user.role,
});

export default function Users() {
  const { data: users = [], isLoading, isError, error } = useSystemUsers();
  const createUserMutation = useCreateSystemUser();
  const updateUserMutation = useUpdateSystemUser();
  const deleteUserMutation = useDeleteSystemUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formState, setFormState] = useState<UserFormState>(createEmptyUserForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const isEditing = editingUserId !== null;
  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.displayName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (userId: string) => {
    setActionError(null);
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  const openAddDialog = () => {
    setEditingUserId(null);
    setFormState(createEmptyUserForm());
    setFormError(null);
    setFormDialogOpen(true);
  };

  const openEditDialog = (user: SystemUser) => {
    setEditingUserId(user.id);
    setFormState(toFormState(user));
    setFormError(null);
    setFormDialogOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingUserId(null);
      setFormState(createEmptyUserForm());
      setFormError(null);
    }
  };

  const handleSave = async () => {
    setFormError(null);

    const name = formState.displayName.trim();
    const email = formState.email.trim();
    const password = formState.password.trim();

    if (!name || !email) {
      setFormError("Display name and email are required.");
      return;
    }

    if (!isEditing && !password) {
      setFormError("Password is required for new users.");
      return;
    }

    try {
      if (isEditing && editingUserId) {
        await updateUserMutation.mutateAsync({
          id: editingUserId,
          data: {
            name,
            email,
            role: formState.role,
            password: password || undefined,
          },
        });
      } else {
        await createUserMutation.mutateAsync({
          name,
          email,
          role: formState.role,
          password,
        });
      }

      setFormDialogOpen(false);
      setEditingUserId(null);
      setFormState(createEmptyUserForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save user.");
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const doctorCount = users.filter((u) => u.role === "doctor").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading users..."
                : "Manage system users and their permissions"}
            </p>
          </div>
          <Dialog open={formDialogOpen} onOpenChange={handleFormOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update user details and save your changes."
                    : "Create a new user account for the system."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formState.displayName}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@medcenter.com"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password {isEditing ? "(optional)" : ""}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                    value={formState.password}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formState.role}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        role: value as SystemUser["role"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
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
                      : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
              <p className="text-xs text-muted-foreground">With admin access</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doctors
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorCount}</div>
              <p className="text-xs text-muted-foreground">Doctor accounts</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading users..."
                    : `${filteredUsers.length} users found`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
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
                {error instanceof Error ? error.message : "Failed to load users."}
              </p>
            )}
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                 
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt || "-"}</TableCell>
                   
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(user.id)}
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
      </div>
    </MainLayout>
  );
}
