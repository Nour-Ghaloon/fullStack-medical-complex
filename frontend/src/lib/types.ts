export type AppRole = "admin" | "doctor" | "patient" | "user";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  specialty: string | null;
  license_number: string | null;
  department: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole | null;
}

// Navigation item types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[]; // If empty, visible to all roles
  badge?: string | number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Notification types
export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationCategory =
  | "appointments"
  | "patients"
  | "billing"
  | "system"
  | "general";

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  type: NotificationType;
  category: NotificationCategory;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  newPatientAlerts: boolean;
  paymentNotifications: boolean;
  systemUpdates: boolean;
}

// Patient types
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female";
  address: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Doctor types
export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  department: string;
  licenseNumber?: string | null;
  status: "active" | "inactive" | "on_leave";
  avatar?: string;
  userId?: string;
  departmentId?: string;
  hireDate?: string;
  bio?: string | null;
  address?: string | null;
}

// Department types
export interface Department {
  id: string;
  name: string;
  code?: string;
  description: string;
  headDoctor?: string;
  staffCount: number;
}

export interface Service {
  id: string;
  name: string;
  code?: string;
  description: string;
  department_id?: number;
  price: number;
  duration: number;
  status: "active" | "inactive";
  department_name: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type?: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes?: string;
}

// Medical Record types
export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  attachments?: string[];
}

// Prescription types
export interface Prescription {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: {
    medicineId?: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  status: "active" | "completed" | "cancelled";
  notes?: string;
}

// Billing types
export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
}

// User Management types
export interface SystemUser {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}

