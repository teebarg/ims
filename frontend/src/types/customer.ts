export type IdentifierType = "tiktok" | "instagram" | "street" | "website";
export const CHANNELS = {
    SHOP: "shop",
    TIKTOK: "tiktok",
    INSTAGRAM: "instagram",
    WEBSITE: "website",
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

export interface Customer {
    id: string;
    displayName: string;
    identifierType: IdentifierType;
    identifier: string;
    phone?: string;
    totalPurchases: number;
    outstandingBalance: number;
    lastPurchaseDate: string | null;
}

export interface SaleLineItem {
    category: string;
    quantity: number;
    amount: number;
}

export interface Sale {
    id: string;
    date: string;
    customerId: string;
    items: SaleLineItem[];
    total: number;
    paid: number;
    channel: Channel;
    status: "paid" | "partial" | "unpaid";
}

export interface Payment {
    id: string;
    saleId: string;
    date: string;
    amount: number;
}

export const identifierTypeLabels: Record<IdentifierType, string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    street: "Street Name",
    website: "Website",
};

export const identifierTypePrefixes: Record<IdentifierType, string> = {
    tiktok: "@",
    instagram: "@",
    street: "",
    website: "",
};

export const channelLabels: Record<string, string> = {
    shop: "Shop",
    tiktok: "TikTok",
    instagram: "Instagram",
    website: "Website",
};

export type DeliveryStatus = "processing" | "out_for_delivery" | "delivered";
export type SaleStatus = "paid" | "partial" | "unpaid";

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
    processing: "Processing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
};

export function apiToDeliveryStatus(status?: string | null): DeliveryStatus {
    switch (status) {
        case "OUT_FOR_DELIVERY":
        case "out_for_delivery":
            return "out_for_delivery";
        case "DELIVERED":
        case "delivered":
            return "delivered";
        default:
            return "processing";
    }
}
