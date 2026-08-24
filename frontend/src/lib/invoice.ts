import { currency } from "@/lib/utils";
import type { SaleDto, SaleItemDto } from "@/lib/api";

export interface OutstandingSale {
    id: string | number;
    reference?: string;
    date: string;
    items: { name: string; quantity: number; unit_price: number; amount: number }[];
    total: number;
    paid: number;
    balance: number;
}

export function toOutstandingSales(sales: SaleDto[], categoryNameById: Map<number, string>): OutstandingSale[] {
    return sales
        .filter((s) => Number(s.balance) > 0)
        .map((s) => ({
            id: s.id,
            reference: s.reference,
            date: s.sale_date,
            items: (s.items || []).map((item) => ({
                name: categoryNameById.get(item.category_id) ?? `Item ${item.category_id}`,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: Number(item.amount),
            })),
            total: Number(s.total_amount),
            paid: Number(s.total_paid),
            balance: Number(s.balance),
        }));
}

export function buildDebtReminderMessage({
    customerName,
    sales,
    businessName = import.meta.env.VITE_APP_NAME,
}: {
    customerName?: string;
    sales: OutstandingSale[];
    businessName?: string;
}): string {
    const totalOwed = sales.reduce((sum, s) => sum + s.balance, 0);

    const lines = sales.map((s) => {
        const itemLines = s.items.map((i) => `  ${i.name} x${i.quantity} @ ${i.unit_price} — ${currency(i.amount)}`).join("\n");
        return `Ref ${s.reference ?? s.id} (${s.date})\n${itemLines}\n  Total ${currency(s.total)} · Paid ${currency(s.paid)} · Balance ${currency(s.balance)}`;
    });

    return [
        `*${businessName}*`,
        customerName
            ? `Hi ${customerName}, this is a friendly reminder of your outstanding balance:`
            : "This is a friendly reminder of your outstanding balance:",
        "",
        ...lines,
        "",
        `*Total balance due: ${currency(totalOwed)}*`,
        "",
        "Kindly settle at your earliest convenience. Thank you for your continued patronage! 🙏",
    ].join("\n\n");
}

export function formatPhoneForWhatsApp(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("0")) return `234${digits.slice(1)}`;
    if (digits.startsWith("234")) return digits;
    return `234${digits}`;
}

export function buildInvoiceMessage({
    items,
    categoryNameById,
    total,
    customerName,
}: {
    items: SaleItemDto[];
    categoryNameById: Map<number, string>;
    total: number;
    customerName?: string;
}): string {
    const lines = items.map((item) => {
        const name = categoryNameById.get(item.category_id) ?? `Category ${item.category_id}`;
        return `${name} x${item.quantity} *  ${item.unit_price} — ${currency(item.amount)}`;
    });

    return [
        `*${import.meta.env.VITE_APP_NAME}*`,
        customerName ? `Hi ${customerName}, here's your receipt:` : "Here's your receipt:",
        "",
        ...lines,
        "",
        `*Total: ${currency(total)}*`,
        "",
        "Thank you for shopping with us! 🧡",
    ]
        .filter((l) => l !== undefined)
        .join("\n");
}
