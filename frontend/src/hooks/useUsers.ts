import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSystemUser,
  deleteSystemUser,
  fetchSystemUsers,
  fetchUsers,
  updateSystemUser,
  type CreateSystemUserInput,
  type UpdateSystemUserInput,
} from "@/services/users";

export const usersQueryKey = ["users"];
export const systemUsersQueryKey = ["users", "management"];

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: fetchUsers,
    staleTime: 60_000,
  });
}

export function useSystemUsers() {
  return useQuery({
    queryKey: systemUsersQueryKey,
    queryFn: fetchSystemUsers,
    staleTime: 30_000,
  });
}

export function useCreateSystemUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSystemUserInput) => createSystemUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemUsersQueryKey });
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useUpdateSystemUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSystemUserInput }) =>
      updateSystemUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemUsersQueryKey });
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}

export function useDeleteSystemUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSystemUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemUsersQueryKey });
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}
