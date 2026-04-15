import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  DollarSign,
  Pill,
  ReceiptText,
  Stethoscope,
  Users,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/lib/types";
import {
  fetchAppointments,
  fetchDoctorAppointments,
  fetchPatientAppointments,
} from "@/services/appointments";
import { fetchDoctors } from "@/services/doctors";
import { fetchInvoices } from "@/services/invoices";
import { fetchPatients } from "@/services/patients";

type DashboardRole = "admin" | "doctor" | "patient";

type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
};

const toDateKey = (value: string) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
};

const toTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMonthPrefix = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getStartMinutes = (range: string) => {
  const start = range.split("-")[0]?.trim() ?? "";
  const parts = start.split(":");
  if (parts.length < 2) return Number.MAX_SAFE_INTEGER;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hours * 60 + minutes;
};

const sortAppointments = (appointments: Appointment[], order: "asc" | "desc") =>
  [...appointments].sort((a, b) => {
    const dateComparison = toDateKey(a.date).localeCompare(toDateKey(b.date));
    if (dateComparison !== 0) {
      return order === "asc" ? dateComparison : -dateComparison;
    }
    const minutesA = getStartMinutes(a.time);
    const minutesB = getStartMinutes(b.time);
    return order === "asc" ? minutesA - minutesB : minutesB - minutesA;
  });

const formatDate = (value: string) => {
  const dateKey = toDateKey(value);
  if (!dateKey) return "Unknown date";
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const role: DashboardRole =
    user?.role === "admin"
      ? "admin"
      : user?.role === "doctor"
        ? "doctor"
        : "patient";

  const canViewAppointments = role === "admin" || role === "doctor" || role === "patient";
  const isAdmin = role === "admin";

  const appointmentsQuery = useQuery({
    queryKey: ["dashboard", "appointments", role],
    queryFn:
      role === "doctor"
        ? fetchDoctorAppointments
        : role === "patient"
          ? fetchPatientAppointments
          : fetchAppointments,
    enabled: canViewAppointments,
    staleTime: 30_000,
  });

  const patientsQuery = useQuery({
    queryKey: ["dashboard", "patients"],
    queryFn: fetchPatients,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const doctorsQuery = useQuery({
    queryKey: ["dashboard", "doctors"],
    queryFn: fetchDoctors,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const invoicesQuery = useQuery({
    queryKey: ["dashboard", "invoices"],
    queryFn: fetchInvoices,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const patients = patientsQuery.data ?? [];
  const doctors = doctorsQuery.data ?? [];

  const displayName = user?.profile?.display_name || user?.email || "User";
  const todayKey = toTodayKey();
  const monthPrefix = toMonthPrefix();

  const {
    upcomingAppointments,
    recentCompletedAppointments,
    todayScheduledCount,
    completedLast7Days,
    uniquePatientCount,
    uniqueDoctorCount,
  } = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];

    const sortedUpcoming = sortAppointments(
      appointments.filter(
        (appointment) =>
          appointment.status === "scheduled" &&
          toDateKey(appointment.date) >= todayKey,
      ),
      "asc",
    );

    const sortedCompleted = sortAppointments(
      appointments.filter((appointment) => appointment.status === "completed"),
      "desc",
    );

    const todayScheduled = appointments.filter(
      (appointment) =>
        toDateKey(appointment.date) === todayKey &&
        appointment.status === "scheduled",
    ).length;

    const cutoffDate = new Date(`${todayKey}T00:00:00`);
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const completedInLastWeek = appointments.filter((appointment) => {
      if (appointment.status !== "completed") return false;
      const rawDate = toDateKey(appointment.date);
      if (!rawDate) return false;
      const parsed = new Date(`${rawDate}T00:00:00`);
      return !Number.isNaN(parsed.getTime()) && parsed >= cutoffDate;
    }).length;

    const uniquePatients = new Set(
      appointments
        .map((appointment) => appointment.patientId)
        .filter((patientId) => patientId.trim().length > 0),
    ).size;

    const uniqueDoctors = new Set(
      appointments
        .map((appointment) => appointment.doctorId)
        .filter((doctorId) => doctorId.trim().length > 0),
    ).size;

    return {
      upcomingAppointments: sortedUpcoming,
      recentCompletedAppointments: sortedCompleted,
      todayScheduledCount: todayScheduled,
      completedLast7Days: completedInLastWeek,
      uniquePatientCount: uniquePatients,
      uniqueDoctorCount: uniqueDoctors,
    };
  }, [appointmentsQuery.data, todayKey]);

  const { pendingInvoices, monthlyRevenue } = useMemo(() => {
    const invoices = invoicesQuery.data ?? [];

    const pending = invoices.filter(
      (invoice) => invoice.status === "pending" || invoice.status === "overdue",
    ).length;

    const revenue = invoices
      .filter(
        (invoice) =>
          invoice.status === "paid" && toDateKey(invoice.date).startsWith(monthPrefix),
      )
      .reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      pendingInvoices: pending,
      monthlyRevenue: revenue,
    };
  }, [invoicesQuery.data, monthPrefix]);

  const roleBadgeClasses =
    role === "admin"
      ? "bg-destructive/10 text-destructive"
      : role === "doctor"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";

  const dashboardError = [appointmentsQuery.error, patientsQuery.error, doctorsQuery.error, invoicesQuery.error].find(
    (error): error is Error => error instanceof Error,
  );

  const isLoading =
    (isAdmin &&
      (appointmentsQuery.isLoading ||
        patientsQuery.isLoading ||
        doctorsQuery.isLoading ||
        invoicesQuery.isLoading)) ||
    (role === "doctor" && appointmentsQuery.isLoading) ||
    (role === "patient" && appointmentsQuery.isLoading);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {displayName}. Here is your {role} overview.
            </p>
          </div>
          <Badge className={`w-fit px-3 py-1 capitalize ${roleBadgeClasses}`}>
            {role} view
          </Badge>
        </div>

        {dashboardError && (
          <Card className="border-destructive/30">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load some dashboard data: {dashboardError.message}
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading dashboard data...
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && role === "admin" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Patients"
                value={patients.length}
                description="Registered patient profiles"
                icon={Users}
              />
              <StatCard
                title="Total Doctors"
                value={doctors.length}
                description="Active and inactive doctors"
                icon={Stethoscope}
              />
              <StatCard
                title="Today Appointments"
                value={todayScheduledCount}
                description="Scheduled for today"
                icon={CalendarCheck2}
              />
              <StatCard
                title="Month Revenue"
                value={monthlyRevenue.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
                description="Paid invoices this month"
                icon={DollarSign}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <DashboardSectionTitle
                    title="Upcoming Appointments"
                    description="Next scheduled appointments across the system"
                  />
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 6).map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{appointment.patientName || "Unknown Patient"}</p>
                            <p className="text-xs text-muted-foreground">
                              with {appointment.doctorName || "Unknown Doctor"}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{formatDate(appointment.date)}</p>
                            <p className="text-muted-foreground">{appointment.time || "TBD"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DashboardSectionTitle
                    title="Finance Snapshot"
                    description="Billing health for today"
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Pending invoices</p>
                    <p className="text-2xl font-semibold">{pendingInvoices}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Unread notifications</p>
                    <p className="text-2xl font-semibold">{unreadCount}</p>
                  </div>
                  <div className="grid gap-2">
                    <Button asChild className="justify-between">
                      <Link to="/appointments">
                        Manage Appointments
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-between">
                      <Link to="/reports">
                        Open Reports
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-between">
                      <Link to="/billing">
                        Review Billing
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!isLoading && role === "doctor" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Today Schedule"
                value={todayScheduledCount}
                description="Scheduled appointments today"
                icon={CalendarCheck2}
              />
              <StatCard
                title="Upcoming Visits"
                value={upcomingAppointments.length}
                description="Future scheduled appointments"
                icon={ClipboardList}
              />
              <StatCard
                title="Patients Seen"
                value={uniquePatientCount}
                description="Unique patients in your queue"
                icon={Users}
              />
              <StatCard
                title="Completed (7d)"
                value={completedLast7Days}
                description="Finished consultations this week"
                icon={Stethoscope}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <DashboardSectionTitle
                    title="Next Appointments"
                    description="Your upcoming patient visits"
                  />
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments in your schedule.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 6).map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{appointment.patientName || "Unknown Patient"}</p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.notes?.trim() || "Consultation"}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{formatDate(appointment.date)}</p>
                            <p className="text-muted-foreground">{appointment.time || "TBD"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DashboardSectionTitle
                    title="Quick Actions"
                    description="Start your daily workflow"
                  />
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild className="justify-between">
                    <Link to="/my-appointments">
                      My Appointments
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link to="/my-records">
                      My Records
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link to="/my-prescriptions">
                      My Prescriptions
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link to="/notifications">
                      Notifications
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <DashboardSectionTitle
                  title="Recent Completed Visits"
                  description="Most recent finished appointments"
                />
              </CardHeader>
              <CardContent>
                {recentCompletedAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No completed visits yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentCompletedAppointments.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{appointment.patientName || "Unknown Patient"}</p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.doctorName || "Doctor"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(appointment.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && role === "patient" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Unread Alerts"
                value={unreadCount}
                description="Notifications waiting for review"
                icon={ReceiptText}
              />
              <StatCard
                title="Upcoming Visits"
                value={upcomingAppointments.length}
                description="Scheduled appointments ahead"
                icon={CalendarCheck2}
              />
              <StatCard
                title="Completed Visits"
                value={recentCompletedAppointments.length}
                description="Appointments marked as completed"
                icon={ClipboardList}
              />
              <StatCard
                title="Care Team"
                value={uniqueDoctorCount}
                description="Doctors connected to your visits"
                icon={Stethoscope}
              />
            </div>

            <Card>
              <CardHeader>
                <DashboardSectionTitle
                  title="Patient Quick Actions"
                  description="Everything important for your care in one place"
                />
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Button asChild className="justify-between">
                  <Link to="/patient-appointments">
                    Open My Appointments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/my-records">
                    Open My Records
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/my-prescriptions">
                    Open My Prescriptions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/profile">
                    Update Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
