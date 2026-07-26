import { forwardRef } from "react";
import type { SaleItemDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { barcodeWidths, TOKENS, TornEdge } from "./shared";

interface InvoiceReceiptProps {
    items: SaleItemDto[];
    categoryNameById: Map<number, string>;
    total: number;
    customerName?: string;
    date?: Date;
}

const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceReceiptProps>(
    ({ items, categoryNameById, total, customerName, date = new Date() }, ref) => {
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
        const widths = barcodeWidths(String("0000"));

        return (
            <div
                ref={ref}
                className="flex flex-col items-center py-8 px-6"
                style={{ backgroundColor: TOKENS.backdrop, width: 360 }}
            >
                <div className="shadow-2xl" style={{ width: 320 }}>
                    <TornEdge />
                    <div className="px-6 py-6" style={{ backgroundColor: TOKENS.paper, color: TOKENS.ink }}>
                        <div className="text-center mb-5">
                            <div
                                className="text-3xl italic"
                                style={{ fontFamily: "'Fraunces', serif", color: TOKENS.ink, fontWeight: 600 }}
                            >
                                {import.meta.env.VITE_APP_NAME}
                            </div>
                        </div>

                        <div className="border-t border-dashed mb-4" style={{ borderColor: TOKENS.goldLine }} />

                        {/* Meta */}
                        <div
                            className="flex justify-between text-[10px] uppercase tracking-wide mb-4"
                            style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            <span>Invoice</span>
                            <span>{date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>

                        {customerName && (
                            <div
                                className="text-xs mb-4"
                                style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                                For {customerName}
                            </div>
                        )}

                        {/* Ledger */}
                        <div className="space-y-2 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {items.map((item) => {
                                const name = categoryNameById.get(item.category_id) ?? `Item ${item.category_id}`;
                                return (
                                    <div key={item.id} className="flex items-baseline text-xs gap-2">
                                        <span className="whitespace-nowrap">{name} x{item.quantity}</span>
                                        <span className="flex-1 border-b border-dotted" style={{ borderColor: TOKENS.inkSoft, transform: "translateY(-3px)" }} />
                                        <span className="whitespace-nowrap font-semibold">{currency(item.amount)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-dashed mb-4" style={{ borderColor: TOKENS.goldLine }} />

                        {/* Totals */}
                        <div className="flex justify-between text-[10px] uppercase mb-1" style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                            <span>Items</span>
                            <span>{totalQty}</span>
                        </div>
                        <div className="flex justify-between items-baseline mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            <span className="text-sm uppercase tracking-wide" style={{ color: TOKENS.gold }}>Total</span>
                            <span className="text-2xl font-semibold">{currency(total)}</span>
                        </div>

                        <div className="text-center text-xs mb-5" style={{ color: TOKENS.inkSoft }}>
                            Thank you for shopping with us
                        </div>

                        <div className="flex items-end justify-center gap-[2px] h-8 mb-1">
                            {widths.map((w, i) => (
                                <div key={i} style={{ width: w, height: "100%", backgroundColor: TOKENS.ink }} />
                            ))}
                        </div>
                        <div
                            className="text-center text-[9px] tracking-[0.3em]"
                            style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            {String("000000").padStart(6, "0")}
                        </div>
                    </div>
                    <TornEdge flip />
                </div>
            </div>
        );
    }
);

InvoiceReceipt.displayName = "InvoiceReceipt";
export default InvoiceReceipt;

// Attach ref to the actual capture target from the parent using this selector helper
export const RECEIPT_CAPTURE_ID = "invoice-receipt-capture";