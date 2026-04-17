import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LandingRoute } from "@/components/layout/LandingRoute";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Departments from "./pages/Departments";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import DoctorAppointments from "./pages/DoctorAppointments";
import PatientAppointments from "./pages/PatientAppointments";
import MyRecords from "./pages/MyRecords";
import MyPrescriptions from "./pages/MyPrescriptions";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AuthProvider>
            <NotificationsProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes - All roles */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Patients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Doctors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "user"]}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "user"]}>
                      <Services />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/records"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                      <Prescriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Billing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Users />
                    </ProtectedRoute>
                  }
                />

                {/* User routes */}
                <Route
                  path="/my-appointments"
                  element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                      <DoctorAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-appointments"
                  element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                      <PatientAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-records"
                  element={
                    <ProtectedRoute allowedRoles={["doctor", "patient"]}>
                      <MyRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={["doctor", "patient"]}>
                      <MyPrescriptions />
                    </ProtectedRoute>
                  }
                />

                {/* Landing route - redirects to dashboard if logged in, login otherwise */}
                <Route path="/" element={<LandingRoute />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
