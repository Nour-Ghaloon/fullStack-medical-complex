import { useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  Receipt,
  Building2,
  Settings,
  Pill,
  ClipboardList,
  UserCog,
  Bell,
  User,
  Briefcase,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppRole, NavItem } from "@/lib/types";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Admin navigation items
const adminNavigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Services",
    href: "/services",
    icon: Briefcase,
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
  },
  {
    title: "Medical Records",
    href: "/records",
    icon: ClipboardList,
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: Pill,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: Receipt,
  },
  // {
  //   title: "Reports",
  //   href: "/reports",
  //   icon: FileText,
  // },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
  },
  // {
  //   title: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  // },
];

// Doctor navigation items
const doctorNavigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "My Schedule",
    href: "/my-appointments",
    icon: Calendar,
  },
  {
    title: "Medical Records",
    href: "/records",
    icon: ClipboardList,
  },
  {
    title: "My Records",
    href: "/my-records",
    icon: ClipboardList,
  },
  {
    title: "My Prescriptions",
    href: "/my-prescriptions",
    icon: Pill,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  // {
  //   title: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  // },
];

// Patient navigation items
const patientNavigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "My Appointments",
    href: "/patient-appointments",
    icon: Calendar,
  },
  {
    title: "My Medical Records",
    href: "/my-records",
    icon: ClipboardList,
  },
  {
    title: "My Prescriptions",
    href: "/my-prescriptions",
    icon: Pill,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  // {
  //   title: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  // },
];

function getNavigationItems(role: AppRole | null): NavItem[] {
  if (role === "admin") {
    return adminNavigationItems;
  }
  if (role === "doctor") {
    return doctorNavigationItems;
  }
  return patientNavigationItems;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const collapsed = state === "collapsed";

  const navigationItems = useMemo(
    () =>
      getNavigationItems(user?.role || null).map((item) =>
        item.href === "/notifications"
          ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
          : item
      ),
    [user?.role, unreadCount]
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                MedCenter
              </span>
              <span className="text-xs text-muted-foreground">
                Management System
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.href}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <p className="text-center text-xs text-muted-foreground">
            (c) {new Date().getFullYear()} MedCenter
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
