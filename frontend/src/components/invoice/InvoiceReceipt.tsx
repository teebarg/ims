import { forwardRef } from "react";
import type { SaleItemDto } from "@/lib/api";
import { currency } from "@/lib/utils";

interface InvoiceReceiptProps {
    items: SaleItemDto[];
    categoryNameById: Map<number, string>;
    total: number;
    businessName?: string;
    tagline?: string;
    customerName?: string;
    saleId?: string | number;
    date?: Date;
}

const TOKENS = {
    backdrop: "#3B1220",
    paper: "#F6EFE2",
    ink: "#221F1A",
    inkSoft: "#7A6E5D",
    gold: "#B8935A",
    goldLine: "#DCC9A0",
};

// Deterministic "barcode" so the same sale always renders the same pattern
function barcodeWidths(seed: string, count = 46) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: count }, (_, i) => {
        hash = (hash * 1103515245 + 12345) >>> 0;
        return 1 + (hash % 4); // widths 1-4px
    });
}

function TornEdge({ flip = false }: { flip?: boolean }) {
    const d =
        "M0,24 L0,10 L20,18 L38,4 L55,14 L72,2 L90,16 L108,6 L125,20 L143,8 " +
        "L160,17 L178,3 L195,15 L213,5 L230,19 L248,9 L265,16 L283,2 L300,14 " +
        "L318,6 L335,20 L353,10 L370,18 L388,4 L400,12 L400,24 Z";
    return (
        <svg
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="w-full h-3 block"
            style={{ transform: flip ? "scaleY(-1)" : undefined }}
        >
            <path d={d} fill={TOKENS.paper} />
        </svg>
    );
}

const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceReceiptProps>(
    ({ items, categoryNameById, total, businessName = "Thriftbyoba", tagline = "Thrift finds, curated.", customerName, saleId, date = new Date() }, ref) => {
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
        const widths = barcodeWidths(String(saleId ?? "0000"));

        return (
            <div
                className="flex flex-col items-center py-8 px-6"
                style={{ backgroundColor: TOKENS.backdrop, width: 360 }}
            >
                <div className="shadow-2xl" style={{ width: 320 }}>
                    <TornEdge />
                    <div className="px-6 py-6" style={{ backgroundColor: TOKENS.paper, color: TOKENS.ink }}>
                        {/* Brand header */}
                        <div className="text-center mb-5">
                            <div
                                className="text-3xl italic"
                                style={{ fontFamily: "'Fraunces', serif", color: TOKENS.ink, fontWeight: 600 }}
                            >
                                {businessName}
                            </div>
                            <div
                                className="text-[10px] tracking-[0.15em] uppercase mt-1"
                                style={{ color: TOKENS.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                                {tagline}
                            </div>
                        </div>

                        <div className="border-t border-dashed mb-4" style={{ borderColor: TOKENS.goldLine }} />

                        {/* Meta */}
                        <div
                            className="flex justify-between text-[10px] uppercase tracking-wide mb-4"
                            style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            <span>Receipt {saleId ? `#${saleId}` : ""}</span>
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

                        {/* Fake barcode */}
                        <div className="flex items-end justify-center gap-[2px] h-8 mb-1">
                            {widths.map((w, i) => (
                                <div key={i} style={{ width: w, height: "100%", backgroundColor: TOKENS.ink }} />
                            ))}
                        </div>
                        <div
                            className="text-center text-[9px] tracking-[0.3em]"
                            style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            {String(saleId ?? "000000").padStart(6, "0")}
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