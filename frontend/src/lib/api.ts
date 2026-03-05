import { getToken } from "@clerk/react";

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi<TResponse>(url: string, options: RequestInit = {}): Promise<TResponse> {
    if (!API_URL) {
        throw new Error("VITE_API_URL is not configured");
    }

    const token = await getToken({ template: "default" });

    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: token ? `Bearer ${token}` : "",
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || "Request failed");
    }

    return res.json() as Promise<TResponse>;
}

// ---- Bales ----

export interface BaleDto {
    id: number;
    reference: string;
    purchase_price: number;
    total_items: number;
    created_at: string;
    updated_at: string;
}

export interface CreateBaleInput {
    reference: string;
    purchase_price: number;
    total_items: number;
    category: string;
}

export function listBales() {
    return fetchApi<BaleDto[]>("/bales");
}

export function createBale(input: CreateBaleInput) {
    return fetchApi<BaleDto>("/bales", {
        method: "POST",
        body: JSON.stringify(input),
    });
}
