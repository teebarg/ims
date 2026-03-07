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

export interface BaleItemDto {
    id: number;
    bale_id: number;
    category_id: number;
    quantity: number;
}

export interface BaleDto {
    id: number;
    reference: string;
    purchase_price: number;
    created_at: string;
    updated_at: string;
    items: BaleItemDto[];
    /** Sum of item quantities. Derived from items when not provided. */
    total_items?: number;
    /** Items left. Present when listing bales. */
    remaining_items?: number;
}

export interface CreateBaleItemInput {
    category_id: number;
    quantity: number;
}

export interface CreateBaleInput {
    reference: string;
    purchase_price: number;
    items: CreateBaleItemInput[];
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

export interface CreateCategoryInput {
    name: string;
}

export function listCategories() {
    return fetchApi<CategoryDto[]>("/categories/");
}

export function createCategory(input: CreateCategoryInput) {
    return fetchApi<CategoryDto>("/categories/", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

// ---- Customers ----
export type ApiIdentifierType = "TIKTOK" | "INSTAGRAM" | "STREET" | "WEBSITE";

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

export type ApiSalesChannel = "SHOP" | "TIKTOK" | "INSTAGRAM" | "WEBSITE";

export interface SaleItemDto {
    id: number;
    category_id: number;
    quantity: number;
    amount: number;
}

export interface SaleDto {
    id: number;
    reference: string;
    customer_id: string;
    channel: ApiSalesChannel | string;
    user_id: string | null;
    sale_date: string;
    created_at: string;
    total_amount: number;
    total_paid: number;
    balance: number;
    items: SaleItemDto[];

    delivery_status?: string | null;
    delivery_assigned_to?: string | null;
    delivery_notes?: string | null;
    out_for_delivery_at?: string | null;
    delivered_at?: string | null;
}

export function listSales() {
    return fetchApi<SaleDto[]>("/sales");
}

export interface CreateSaleInput {
    customer_id: string;
    channel: ApiSalesChannel | string;
    user_id?: string | null;
    sale_date?: string | null;
    items: Array<{
        category_id: number;
        quantity: number;
        amount: number;
    }>;
}

export function createSale(input: CreateSaleInput) {
    return fetchApi<SaleDto>("/sales", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export interface UpdateSaleDeliveryInput {
    delivery_status?: string;
    delivery_assigned_to?: string | null;
    delivery_notes?: string | null;
}

export function updateSaleDelivery(saleId: number, input: UpdateSaleDeliveryInput) {
    return fetchApi<SaleDto>(`/sales/${saleId}/delivery`, {
        method: "PATCH",
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

// ---- Analytics (dashboard) ----

export interface AnalyticsSummaryDto {
    total_revenue: number;
}

export interface SalesTrendPointDto {
    period_start: string;
    total_amount: number;
    total_cost?: number;
    total_profit?: number;
}

export interface SalesTrendResponseDto {
    period: string;
    points: SalesTrendPointDto[];
}

export interface StockSnapshotDto {
    total_stock: number;
    categories: { category: string; quantity: number }[];
}

export function getAnalyticsSummary() {
    return fetchApi<AnalyticsSummaryDto>("/analytics/");
}

export function getAnalyticsTrends(period: "weekly" | "monthly" = "monthly") {
    return fetchApi<SalesTrendResponseDto>(`/analytics/trends?period=${period}`);
}

export function getAnalyticsStock() {
    return fetchApi<StockSnapshotDto>("/analytics/stock");
}

export interface TopCustomerDto {
    customer_id: string;
    display_name: string;
    purchases: number;
    spent: number;
}

export function getTopCustomers(limit: number = 5) {
    return fetchApi<TopCustomerDto[]>(`/analytics/top-customers?limit=${limit}`);
}

export interface ChannelStatDto {
    channel: string;
    count: number;
    revenue: number;
    percentage: number;
}

export function getChannelStats() {
    return fetchApi<ChannelStatDto[]>("/analytics/channels");
}
