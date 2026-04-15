import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoice,
  deleteInvoice,
  fetchInvoices,
  fetchInvoiceServices,
  updateInvoice,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from "@/services/invoices";

export const invoicesQueryKey = ["invoices"];
export const invoiceServicesQueryKey = ["invoice-services"];

export function useInvoices() {
  return useQuery({
    queryKey: invoicesQueryKey,
    queryFn: fetchInvoices,
    staleTime: 30_000,
  });
}

export function useInvoiceServices() {
  return useQuery({
    queryKey: invoiceServicesQueryKey,
    queryFn: fetchInvoiceServices,
    staleTime: 60_000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
    },
  });
}
