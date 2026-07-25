import { SaleItemDto } from "./api";
import { currency } from "./utils";

export function formatPhoneForWhatsApp(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("0")) return `234${digits.slice(1)}`;
    if (digits.startsWith("234")) return digits;
    return `234${digits}`;
}

export function buildInvoiceMessage({ items, categoryNameById, total, customerName }: {
    items: SaleItemDto[];
    categoryNameById: Map<number, string>;
    total: number;
    customerName?: string;
}): string {
    const lines = items.map((item) => {
        const name = categoryNameById.get(item.category_id) ?? `Category ${item.category_id}`;
        return `${name} x${item.quantity} — ${currency(item.amount)}`;
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
    ].filter((l) => l !== undefined).join("\n");
}