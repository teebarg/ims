import { useNavigate } from "react-router-dom";
import { channelLabels, type DeliveryStatus } from "@/types/customer";
import { type SaleDto, type ApiSalesChannel } from "@/lib/api";
import { currency, formatDate } from "@/lib/utils";
import SalesDetails from "@/components/sales/sales-details";
import SalePaymentsDetails from "@/components/sales/sale-payments-details";
import DeliveryBadge from "@/components/sales/delivery-badge";
import SalesActions from "@/components/sales/sales-actions";
import { Truck } from "lucide-react";
import { apiToUiChannel, saleStatus } from "@/lib/sales";


const STATUS_STYLES = {
    paid: { border: "border-l-emerald-500", label: "text-emerald-600" },
    partial: { border: "border-l-amber-500", label: "text-amber-600" },
    unpaid: { border: "border-l-destructive", label: "text-destructive" },
} as const;

export default function MobileSaleCard({ sale, c_display_name, c_identifier }: { sale: SaleDto; c_display_name?: string; c_identifier?: string }) {
    const navigate = useNavigate();
    const status = saleStatus(sale);
    const ch = apiToUiChannel(sale.channel as ApiSalesChannel);
    const deliveryStatus = (sale.delivery_status as DeliveryStatus)?.toLowerCase() || "processing";
    const bal = Number(sale.total_amount) - Number(sale.total_paid);
    const itemsCount = sale.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
    const style = STATUS_STYLES[status];

    return (
        <div className={`border-l-2 ${style.border} px-4 py-3 space-y-2 bg-card rounded-md overflow-hidden`}>
            <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold">{sale.reference}</span>
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${style.label}`}>{status}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{formatDate(sale.created_at)}</span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        className="text-sm font-medium text-left hover:underline"
                        onClick={() => navigate(`/customers/${sale.customer_id}`)}
                    >
                        {c_display_name}
                    </button>
                    <SalePaymentsDetails saleId={sale.id} customerId={sale.customer_id} saleTotal={sale.total_amount} />
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                    {c_identifier} · {channelLabels[ch]}
                </span>
            </div>

            <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{itemsCount} items</span>
                <div className="flex items-baseline gap-2">
                    {status !== "paid" && (
                        <span className="text-xs text-destructive">Bal {currency(bal)}</span>
                    )}
                    <span className="font-semibold text-sm">{currency(sale.total_amount)}</span>
                </div>
            </div>

            {deliveryStatus !== "processing" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3 w-3" />
                    <span>
                        {deliveryStatus === "out_for_delivery"
                            ? `Out for delivery · ${sale.delivery_assigned_to || "Unassigned"}`
                            : "Delivered"}
                    </span>
                    <DeliveryBadge status={(deliveryStatus as DeliveryStatus)} />
                </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-dashed">
                <SalesDetails customerName={c_display_name} label={`${itemsCount} items`} items={sale.items || []} total={sale.total_amount} />
                <SalesActions sale={sale} displayName={c_display_name || ""} status={status} />
            </div>
        </div>
    );
}