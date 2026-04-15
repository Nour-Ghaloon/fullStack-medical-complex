/**
 * API Configuration for Laravel Backend
 *
 * This file provides the base configuration for all API calls.
 * Update API_BASE_URL when connecting to your Laravel backend.
 */

// TODO: Update this to your Laravel API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface ApiErrorShape {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Get the stored auth token
 */
export function getAuthToken(): string | null {
  const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token");
  if (!token) return null;

  const normalized = token.trim();
  if (!normalized) return null;

  // Guard against accidentally stringified JSON tokens.
  if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
    return normalized.slice(1, -1);
  }

  return normalized;
}

/**
 * Set the auth token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("token", token);
}

/**
 * Remove the auth token
 */
export function removeAuthToken(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
}

/**
 * Base API request function
 * Handles authentication headers and error responses
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = getAuthToken();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data: unknown;

  // Only try to parse JSON if there's content
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (isJson && response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    data = {};
  }

  if (!response.ok) {
    // Laravel validation errors typically come in this format
    const errorData = data as ApiErrorShape;
    if (errorData?.errors) {
      const firstError = Object.values(errorData.errors).flat()[0];
      const message =
        typeof firstError === "string"
          ? firstError
          : typeof errorData.message === "string"
            ? errorData.message
            : typeof errorData.error === "string"
              ? errorData.error
            : "An error occurred";
      throw new Error(message);
    }
    if (response.status === 401) {
      // Keep auth state consistent if backend rejected the JWT/session.
      removeAuthToken();
      throw new Error("Your session expired or is invalid. Please log in again.");
    }

    throw new Error(
      typeof errorData?.message === "string"
        ? errorData.message
        : typeof errorData?.error === "string"
          ? errorData.error
        : `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

/**
 * Auth API endpoints
 */
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ user: { id: number; name: string; email: string | null; role?: string | null }; token: string }>(
      "/login",
      {
      method: "POST",
      body: { email, password },
      },
    ),

  signup: (name: string, email: string, password: string) =>
    apiRequest<{
      user: { id: number; name: string; email: string | null; role?: string | null };
      token: string;
      message?: string;
    }>("/register", {
      method: "POST",
      body: {
        name,
        email,
        password,
        password_confirmation: password,
      },
    }),

  signupWithRole: (
    name: string,
    email: string,
    role: "admin" | "doctor" | "patient",
    password: string,
    passwordConfirmation: string,
  ) =>
    apiRequest<{
      user: { id: number; name: string; email: string | null; role?: string | null };
      token: string;
      message?: string;
    }>("/register", {
      method: "POST",
      body: {
        name,
        email,
        role,
        password,
        password_confirmation: passwordConfirmation,
      },
    }),

  logout: () =>
    apiRequest<void>("/logout", {
      method: "POST",
    }),

  getUser: () =>
    apiRequest<{ id: number; name: string; email: string | null; role?: string | null }>(
      "/profile",
      {
      method: "GET",
      },
    ),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, email: string, password: string) =>
    apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: {
        token,
        email,
        password,
        password_confirmation: password,
      },
    }),
};

