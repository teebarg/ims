export type IdentifierType = "tiktok" | "instagram" | "street" | "app";

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

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  items: number;
  total: number;
  paid: number;
  channel: "shop" | "social" | "website";
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
  app: "App User",
};

export const identifierTypePrefixes: Record<IdentifierType, string> = {
  tiktok: "@",
  instagram: "@",
  street: "",
  app: "",
};

export const channelLabels: Record<string, string> = {
  shop: "Shop",
  social: "Social Media",
  website: "Website",
};
