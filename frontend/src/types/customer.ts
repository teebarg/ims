
export const Channels = [
    "SHOP",
    "TIKTOK",
    "FACEBOOK",
    "INSTAGRAM",
    "WEBSITE",
] as const;

export type ChannelType = (typeof Channels)[number]

export const ChannelLabels: Record<ChannelType, string> = {
    SHOP: "Shop",
    TIKTOK: "TikTok",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    WEBSITE: "Website",
};


export const Status = [
    "PROCESSING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
] as const;

export type StatusType = (typeof Status)[number]

export const StatusLabels: Record<StatusType, string> = {
    PROCESSING: "Processing",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
};

export type SaleStatus = "paid" | "partial" | "unpaid";

export interface Customer {
    id: string;
    displayName: string;
    identifierType: ChannelType;
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
    unit_price: number;
}

export interface Sale {
    id: string;
    date: string;
    customerId: string;
    items: SaleLineItem[];
    total: number;
    paid: number;
    channel: ChannelType;
    status: "paid" | "partial" | "unpaid";
}

export interface Payment {
    id: string;
    saleId: string;
    date: string;
    amount: number;
}
