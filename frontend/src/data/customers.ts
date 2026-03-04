import { Customer, Sale, Payment } from "@/types/customer";

export const initialCustomers: Customer[] = [
  { id: "CU-001", displayName: "Sarah Kimani", identifierType: "instagram", identifier: "@sarah.thrifts", phone: "+254712345678", totalPurchases: 335, outstandingBalance: 0, lastPurchaseDate: "2026-03-03" },
  { id: "CU-002", displayName: "Bella Wanjiku", identifierType: "tiktok", identifier: "@bella.thrift", phone: "", totalPurchases: 288, outstandingBalance: 38, lastPurchaseDate: "2026-03-03" },
  { id: "CU-003", displayName: "James Mwangi", identifierType: "app", identifier: "james.m", phone: "+254700111222", totalPurchases: 210, outstandingBalance: 0, lastPurchaseDate: "2026-03-02" },
  { id: "CU-004", displayName: "Choko", identifierType: "street", identifier: "Choko", phone: "", totalPurchases: 45, outstandingBalance: 45, lastPurchaseDate: "2026-03-02" },
  { id: "CU-005", displayName: "Amina Leila", identifierType: "instagram", identifier: "@amina.styles", phone: "+254733444555", totalPurchases: 168, outstandingBalance: 68, lastPurchaseDate: "2026-03-01" },
  { id: "CU-006", displayName: "David Otieno", identifierType: "app", identifier: "david.o", phone: "+254722333444", totalPurchases: 92, outstandingBalance: 0, lastPurchaseDate: "2026-03-01" },
];

export const initialSales: Sale[] = [
  { id: "SL-001", date: "2026-03-03", customerId: "CU-001", items: 5, total: 125, paid: 125, channel: "shop", status: "paid" },
  { id: "SL-002", date: "2026-03-03", customerId: "CU-002", items: 3, total: 78, paid: 40, channel: "social", status: "partial" },
  { id: "SL-003", date: "2026-03-02", customerId: "CU-003", items: 8, total: 210, paid: 210, channel: "website", status: "paid" },
  { id: "SL-004", date: "2026-03-02", customerId: "CU-004", items: 2, total: 45, paid: 0, channel: "shop", status: "unpaid" },
  { id: "SL-005", date: "2026-03-01", customerId: "CU-005", items: 6, total: 168, paid: 100, channel: "shop", status: "partial" },
  { id: "SL-006", date: "2026-03-01", customerId: "CU-006", items: 4, total: 92, paid: 92, channel: "website", status: "paid" },
  { id: "SL-007", date: "2026-02-28", customerId: "CU-001", items: 7, total: 210, paid: 210, channel: "website", status: "paid" },
  { id: "SL-008", date: "2026-02-27", customerId: "CU-002", items: 5, total: 210, paid: 210, channel: "social", status: "paid" },
];

export const initialPayments: Payment[] = [
  { id: "PY-001", saleId: "SL-001", date: "2026-03-03", amount: 125 },
  { id: "PY-002", saleId: "SL-002", date: "2026-03-03", amount: 40 },
  { id: "PY-003", saleId: "SL-003", date: "2026-03-02", amount: 210 },
  { id: "PY-004", saleId: "SL-005", date: "2026-03-01", amount: 100 },
  { id: "PY-005", saleId: "SL-006", date: "2026-03-01", amount: 92 },
  { id: "PY-006", saleId: "SL-007", date: "2026-02-28", amount: 210 },
  { id: "PY-007", saleId: "SL-008", date: "2026-02-27", amount: 210 },
];
