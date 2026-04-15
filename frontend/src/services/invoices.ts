import { apiRequest } from "@/lib/api";
import type { Invoice } from "@/lib/types";

type InvoiceStatusApi = "paid" | "unpaid" | "pending";

type ServiceApi = {
  id: number;
  name: string;
  price: number | string | null;
  status?: "active" | "inactive";
};

type InvoiceDetailApi = {
  id: number;
  service_id: number;
  quantity: number | string;
  service?: ServiceApi | null;
};

type PatientApi = {
  id: number;
  user?: {
    id: number;
    name: string;
    email: string | null;
  } | null;
};

type AppointmentApi = {
  id: number;
  patient?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string | null;
    } | null;
  } | null;
};

type InvoiceApi = {
  id: number;
  appointment_id: number | null;
  patient_id: number;
  invoice_date: string;
  total_amount: number | string;
  status: InvoiceStatusApi;
  patient?: PatientApi | null;
  appointment?: AppointmentApi | null;
  invoice_details?: InvoiceDetailApi[];
  invoiceDetails?: InvoiceDetailApi[];
};

type InvoiceMutationResponse = {
  message?: string;
  invoice?: InvoiceApi;
};

export type InvoiceServiceOption = {
  id: string;
  name: string;
  price: number;
};

export type InvoiceLineItemInput = {
  serviceId: string;
  quantity: number;
};

export type CreateInvoiceInput = {
  patientId: string;
  appointmentId?: string | null;
  invoiceDate: string;
  status: Invoice["status"];
  items: InvoiceLineItemInput[];
};

export type UpdateInvoiceInput = {
  patientId?: string;
  appointmentId?: string | null;
  invoiceDate?: string;
  status?: Invoice["status"];
  items?: InvoiceLineItemInput[];
};

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (dateValue: string, days: number) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const toBackendStatus = (status?: Invoice["status"]): InvoiceStatusApi | undefined => {
  if (!status) return undefined;
  if (status === "paid") return "paid";
  if (status === "pending") return "pending";
  if (status === "overdue") return "unpaid";
  return "pending";
};

const toUiStatus = (status: InvoiceStatusApi): Invoice["status"] => {
  if (status === "paid") return "paid";
  if (status === "pending") return "pending";
  return "overdue";
};

const getInvoiceDetails = (invoice: InvoiceApi): InvoiceDetailApi[] =>
  invoice.invoice_details ?? invoice.invoiceDetails ?? [];

const toInvoice = (invoice: InvoiceApi): Invoice => {
  const date = toDateOnly(invoice.invoice_date);
  const dueDate = addDays(date, 14);
  const details = getInvoiceDetails(invoice);

  const items = details.map((detail) => {
    const quantity = Number(detail.quantity ?? 0);
    const unitPrice = Number(detail.service?.price ?? 0);
    return {
      description: detail.service?.name ?? `Service #${detail.service_id}`,
      quantity,
      unitPrice,
      total: Number((quantity * unitPrice).toFixed(2)),
    };
  });

  const itemsSubtotal = Number(
    items.reduce((sum, item) => sum + item.total, 0).toFixed(2),
  );
  const backendTotal = Number(invoice.total_amount ?? 0);
  const subtotal = items.length > 0 ? itemsSubtotal : backendTotal;
  const total = Number((backendTotal || subtotal).toFixed(2));
  const tax = Number((total - subtotal).toFixed(2));

  const patientName =
    invoice.patient?.user?.name ??
    invoice.appointment?.patient?.user?.name ??
    `Patient #${invoice.patient_id}`;

  return {
    id: String(invoice.id),
    patientId: String(invoice.patient_id),
    patientName,
    date,
    dueDate,
    items,
    subtotal,
    tax: tax > 0 ? tax : 0,
    total,
    status: toUiStatus(invoice.status),
  };
};

const toPayloadItems = (items: InvoiceLineItemInput[]) =>
  items.map((item) => ({
    service_id: Number(item.serviceId),
    quantity: item.quantity,
  }));

const getInvoiceFromMutation = (response: InvoiceMutationResponse | InvoiceApi) => {
  if ("invoice" in response && response.invoice) {
    return response.invoice;
  }
  return response as InvoiceApi;
};

export async function fetchInvoices(): Promise<Invoice[]> {
  const invoices = await apiRequest<InvoiceApi[]>("/invoices");
  return invoices.map(toInvoice);
}

export async function fetchInvoiceServices(): Promise<InvoiceServiceOption[]> {
  const services = await apiRequest<ServiceApi[]>("/services");
  return services
    .filter((service) => !service.status || service.status === "active")
    .map((service) => ({
      id: String(service.id),
      name: service.name,
      price: Number(service.price ?? 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const response = await apiRequest<InvoiceMutationResponse | InvoiceApi>("/invoices", {
    method: "POST",
    body: {
      patient_id: Number(input.patientId),
      appointment_id: input.appointmentId ? Number(input.appointmentId) : null,
      invoice_date: input.invoiceDate,
      status: toBackendStatus(input.status) ?? "pending",
      items: toPayloadItems(input.items),
    },
  });

  return toInvoice(getInvoiceFromMutation(response));
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
): Promise<Invoice> {
  const response = await apiRequest<InvoiceMutationResponse | InvoiceApi>(`/invoices/${id}`, {
    method: "PUT",
    body: {
      patient_id: input.patientId ? Number(input.patientId) : undefined,
      appointment_id:
        input.appointmentId === null
          ? null
          : input.appointmentId
            ? Number(input.appointmentId)
            : undefined,
      invoice_date: input.invoiceDate,
      status: toBackendStatus(input.status),
      items: input.items ? toPayloadItems(input.items) : undefined,
    },
  });

  return toInvoice(getInvoiceFromMutation(response));
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiRequest<void>(`/invoices/${id}`, {
    method: "DELETE",
  });
}
