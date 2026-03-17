export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: "BUYER" | "SUPPLIER";
};

type ApiFetchOptions = Omit<RequestInit, "credentials">;

type RegisterData = {
    name: string;
    email: string;
    password: string;
    role: "BUYER" | "SUPPLIER";
};

type LoginData = {
    email: string;
    password: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const shouldSendJsonHeader = method !== "GET";

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(shouldSendJsonHeader ? { "Content-Type": "application/json" } : {}),
            ...(options.headers ?? {})
        }
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Request failed";
        throw new Error(message);
    }

    return data as T;
}

export function registerUser(data: RegisterData): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function loginUser(data: LoginData): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function logoutUser(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/api/auth/logout", {
        method: "POST"
    });
}

export function getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/me");
}
