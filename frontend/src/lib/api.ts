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

export interface BaleDto {
    id: number;
    reference: string;
    category_id: number;
    purchase_price: number;
    total_items: number;
    created_at: string;
    updated_at: string;
}

export interface CreateBaleInput {
    reference: string;
    category_id: number;
    purchase_price: number;
    total_items: number;
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

// ---- Categories ----

export interface CategoryDto {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export function listCategories() {
    return fetchApi<CategoryDto[]>("/categories/");
}

// ---- Customers ----

export type ApiIdentifierType = "TIKTOK" | "INSTAGRAM" | "STREET" | "APP_USER";

export interface CustomerDto {
    id: string;
    display_name: string;
    identifier: string;
    identifier_type: ApiIdentifierType;
    phone: string | null;
    created_at: string;
    updated_at: string;
    /** Present when listing customers (GET /customers) */
    balance?: number;
    lifetime_value?: number;
    last_sale_date?: string | null;
}

export interface CreateCustomerInput {
    display_name: string;
    identifier: string;
    identifier_type: ApiIdentifierType;
    phone?: string | null;
}

export interface UpdateCustomerInput extends CreateCustomerInput {}

export function listCustomers() {
    return fetchApi<CustomerDto[]>("/customers");
}

export function createCustomer(input: CreateCustomerInput) {
    return fetchApi<CustomerDto>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateCustomer(id: string, input: UpdateCustomerInput) {
    return fetchApi<CustomerDto>(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export function deleteCustomer(id: string) {
    return fetchApi<{ details: string }>(`/customers/${id}`, {
        method: "DELETE",
    });
}

export function getCustomer(id: string) {
    return fetchApi<CustomerDto>(`/customers/${id}`);
}

export interface CustomerProfileDto {
    customer: CustomerDto;
    sales: SaleDto[];
    balance: number;
    lifetime_value: number;
    payments: PaymentDto[];
}

export function getCustomerProfile(id: string) {
    return fetchApi<CustomerProfileDto>(`/customers/${id}/profile`);
}

export type ApiSalesChannel = "SHOP" | "SOCIAL_MEDIA" | "WEBSITE";

export interface SaleDto {
    id: number;
    bale_id: number;
    customer_id: string;
    category_id: number;
    total_quantity: number;
    unit_price: number;
    channel: ApiSalesChannel;
    user_id: string | null;
    sale_date: string;
    created_at: string;
    total_amount: number;
    total_paid: number;
    balance: number;
}

export function listSales() {
    return fetchApi<SaleDto[]>("/sales");
}

export interface CreateSaleInput {
    bale_id: number;
    customer_id: string;
    category_id: number;
    total_quantity: number;
    unit_price: number;
    channel: ApiSalesChannel;
    user_id?: string | null;
    sale_date?: string | null;
}

export function createSale(input: CreateSaleInput) {
    return fetchApi<SaleDto>("/sales", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function getCustomerSales(customerId: string) {
    return fetchApi<SaleDto[]>(`/customers/${customerId}/sales`);
}

export function getCustomerBalance(customerId: string) {
    return fetchApi<{ customer_id: string; balance: number }>(`/customers/${customerId}/balance`);
}

export function getCustomerLtv(customerId: string) {
    return fetchApi<{ customer_id: string; lifetime_value: number }>(`/customers/${customerId}/lifetime_value`);
}

export interface PaymentDto {
    id: number;
    sale_id: number;
    amount: number;
    method: string;
    reference: string | null;
    payment_date: string;
    created_at: string;
}

export function getCustomerPayments(customerId: string) {
    return fetchApi<PaymentDto[]>(`/customers/${customerId}/payments`);
}

export interface CreatePaymentInput {
    sale_id: number;
    amount: number;
    method: string;
    reference?: string | null;
}

export function createPayment(input: CreatePaymentInput) {
    return fetchApi<PaymentDto>("/payments", {
        method: "POST",
        body: JSON.stringify(input),
    });
}
