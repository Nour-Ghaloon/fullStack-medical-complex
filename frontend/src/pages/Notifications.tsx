import { useMemo, useState, type ComponentType } from "react";
import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  Bell,
  BellRing,
  Calendar,
  CheckCheck,
  CircleDot,
  CreditCard,
  Inbox,
  Search,
  Server,
  Trash2,
  Users,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification, NotificationCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type FilterValue = "all" | "unread" | NotificationCategory;

const categoryLabels: Record<NotificationCategory, string> = {
  appointments: "Appointments",
  patients: "Patients",
  billing: "Billing",
  system: "System",
  general: "General",
};

const categoryIcons: Record<
  NotificationCategory,
  ComponentType<{ className?: string }>
> = {
  appointments: Calendar,
  patients: Users,
  billing: CreditCard,
  system: Server,
  general: Bell,
};

const typeDotStyles: Record<Notification["type"], string> = {
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-destructive",
};

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearRead,
    clearAll,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return sortedNotifications.filter((notification) => {
      if (activeFilter === "unread" && notification.read) {
        return false;
      }
      if (
        activeFilter !== "all" &&
        activeFilter !== "unread" &&
        notification.category !== activeFilter
      ) {
        return false;
      }

      if (!lowerQuery) {
        return true;
      }

      return (
        notification.title.toLowerCase().includes(lowerQuery) ||
        notification.description.toLowerCase().includes(lowerQuery)
      );
    });
  }, [activeFilter, query, sortedNotifications]);

  const priorityCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read &&
          (notification.type === "warning" || notification.type === "error")
      ).length,
    [notifications]
  );

  const todayCount = useMemo(
    () =>
      notifications.filter((notification) =>
        isToday(new Date(notification.createdAt))
      ).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Monitor alerts, updates, and patient activity in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
            <Button variant="outline" onClick={clearRead} disabled={readCount === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear read
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <BellRing className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Need your attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Priority</CardTitle>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{priorityCount}</div>
              <p className="text-xs text-muted-foreground">Warning or error alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">Created today</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications..."
                className="pl-8"
              />
            </div>

            <Tabs
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as FilterValue)}
            >
              <div className="overflow-x-auto">
                <TabsList className="w-max min-w-full justify-start">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="patients">Patients</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>

          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No notifications found</p>
                <p className="text-xs text-muted-foreground">
                  Try a different filter or search term.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const CategoryIcon = categoryIcons[notification.category];

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        !notification.read && "border-primary/40 bg-primary/5"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{notification.title}</p>
                            <CircleDot
                              className={cn("h-3.5 w-3.5", typeDotStyles[notification.type])}
                            />
                            <Badge variant="outline">
                              {categoryLabels[notification.category]}
                            </Badge>
                            {!notification.read && (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                New
                              </Badge>
                            )}
                          </div>

                          <CardDescription>{notification.description}</CardDescription>

                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            {"  "}
                            ({formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })})
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              notification.read
                                ? markAsUnread(notification.id)
                                : markAsRead(notification.id)
                            }
                          >
                            {notification.read ? "Mark unread" : "Mark read"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
