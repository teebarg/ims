import { forwardRef } from "react";
import { currency } from "@/lib/utils";
import type { OutstandingSale } from "@/lib/invoice";
import { TOKENS, StampBadge } from "./shared";

interface DebtStatementProps {
    customerName?: string;
    sales: OutstandingSale[];
    asAt?: Date;
}

const DebtStatement = forwardRef<HTMLDivElement, DebtStatementProps>(
    ({ customerName, sales, asAt = new Date() }, ref) => {
        const totalPurchased = sales.reduce((sum, s) => sum + s.total, 0);
        const totalPaid = sales.reduce((sum, s) => sum + s.paid, 0);
        const totalOwed = sales.reduce((sum, s) => sum + s.balance, 0);

        return (
            <div ref={ref} className="flex flex-col items-center py-8 px-6" style={{ backgroundColor: TOKENS.backdrop, width: 400 }}>
                <div className="relative shadow-2xl px-7 py-7" style={{ width: 360, backgroundColor: TOKENS.paper, color: TOKENS.ink }}>
                    <StampBadge />

                    {/* Letterhead */}
                    <div className="mb-1">
                        <div className="text-2xl italic" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
                            {import.meta.env.VITE_APP_NAME}
                        </div>
                        <div
                            className="text-[10px] uppercase tracking-[0.15em] mt-1"
                            style={{ color: TOKENS.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            Statement of account
                        </div>
                    </div>

                    <div className="border-t-2 mt-3 mb-4" style={{ borderColor: TOKENS.goldLine }} />

                    <div
                        className="flex justify-between text-[10px] uppercase tracking-wide mb-5"
                        style={{ color: TOKENS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                        <span>{customerName ? `For ${customerName}` : "Customer"}</span>
                        <span>As at {asAt.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>

                    {/* Per-sale breakdown */}
                    <div className="space-y-4 mb-4">
                        {sales.map((sale) => (
                            <div key={sale.id}>
                                <div
                                    className="text-[10px] uppercase tracking-wide mb-1.5"
                                    style={{ color: TOKENS.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                    Ref {sale.reference ?? sale.id} · {sale.date}
                                </div>
                                <div className="space-y-1 mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    {sale.items.map((item, i) => (
                                        <div key={i} className="flex items-baseline text-xs gap-2">
                                            <span className="whitespace-nowrap">
                                                {item.name} x{item.quantity} @ {currency(item.unit_price)}
                                            </span>
                                            <span
                                                className="flex-1 border-b border-dotted"
                                                style={{ borderColor: TOKENS.inkSoft, transform: "translateY(-3px)" }}
                                            />
                                            <span className="whitespace-nowrap">{currency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[12.5px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    <span style={{ color: TOKENS.inkSoft }}>
                                        Total {currency(sale.total)} · Paid {currency(sale.paid)}
                                    </span>
                                    <span className="font-semibold" style={{ color: TOKENS.stampRed }}>
                                        Bal {currency(sale.balance)}
                                    </span>
                                </div>
                                <div className="border-t border-dashed mt-3" style={{ borderColor: TOKENS.goldLine }} />
                            </div>
                        ))}
                    </div>

                    {/* Grand totals */}
                    <div className="space-y-1 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <div className="flex justify-between text-xs" style={{ color: TOKENS.inkSoft }}>
                            <span>Total purchased</span>
                            <span>{currency(totalPurchased)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ color: TOKENS.inkSoft }}>
                            <span>Total paid</span>
                            <span>{currency(totalPaid)}</span>
                        </div>
                    </div>
                    <div className="border-t-2 mb-2" style={{ borderColor: TOKENS.stampRed }} />
                    <div className="flex justify-between items-baseline mb-5">
                        <span
                            className="text-sm uppercase tracking-wide"
                            style={{ color: TOKENS.stampRed, fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                            Balance due
                        </span>
                        <span className="text-2xl font-bold" style={{ color: TOKENS.stampRed }}>
                            {currency(totalOwed)}
                        </span>
                    </div>

                    <div className="text-center text-xs" style={{ color: TOKENS.inkSoft }}>
                        Kindly settle at your earliest convenience.
                    </div>
                </div>
            </div>
        );
    }
);

DebtStatement.displayName = "DebtStatement";
export default DebtStatement;