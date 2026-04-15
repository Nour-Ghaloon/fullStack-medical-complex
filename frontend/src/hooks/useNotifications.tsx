/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Notification } from "@/lib/types";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "New Appointment",
    description: "Sarah Johnson scheduled an appointment for tomorrow at 10:00 AM.",
    createdAt: "2026-02-19T10:14:00Z",
    read: false,
    type: "info",
    category: "appointments",
  },
  {
    id: "2",
    title: "Lab Results Ready",
    description: "Blood work results for Patient #2847 are now available.",
    createdAt: "2026-02-19T09:00:00Z",
    read: false,
    type: "success",
    category: "patients",
  },
  {
    id: "3",
    title: "Invoice Overdue",
    description: "Invoice #1234 is now overdue and requires follow-up.",
    createdAt: "2026-02-19T06:30:00Z",
    read: false,
    type: "warning",
    category: "billing",
  },
  {
    id: "4",
    title: "Appointment Cancelled",
    description: "Michael Brown cancelled his appointment for February 20.",
    createdAt: "2026-02-18T17:42:00Z",
    read: true,
    type: "warning",
    category: "appointments",
  },
  {
    id: "5",
    title: "System Maintenance",
    description: "System maintenance is scheduled tonight at 11:00 PM.",
    createdAt: "2026-02-18T12:15:00Z",
    read: true,
    type: "info",
    category: "system",
  },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAsRead: (id: string) => {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        );
      },
      markAsUnread: (id: string) => {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read: false } : notification
          )
        );
      },
      markAllAsRead: () => {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
      },
      deleteNotification: (id: string) => {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== id)
        );
      },
      clearRead: () => {
        setNotifications((prev) => prev.filter((notification) => !notification.read));
      },
      clearAll: () => {
        setNotifications([]);
      },
    }),
    [notifications, unreadCount]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
