import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { channelLabels, type DeliveryStatus } from "@/types/customer";
import { type SaleDto, type ApiSalesChannel } from "@/lib/api";
import { currency, formatDate } from "@/lib/utils";
import { Channel } from "@/types/customer";
import SalesDetails from "@/components/sales/sales-details";
import SalePaymentsDetails from "@/components/sales/sale-payments-details";
import DeliveryBadge from "@/components/sales/delivery-badge";
import SalesActions from "@/components/sales/sales-actions";
import { Truck } from "lucide-react";

function apiToUiChannel(ch: ApiSalesChannel): Channel {
    switch (ch) {
        case "SHOP":
            return "shop";
        case "TIKTOK":
            return "tiktok";
        case "INSTAGRAM":
            return "instagram";
        case "WEBSITE":
            return "website";
        default:
            return "shop";
    }
}

function saleStatus(sale: SaleDto): "paid" | "partial" | "unpaid" {
    if (Number(sale.balance) <= 0) return "paid";
    if (Number(sale.total_paid) > 0) return "partial";
    return "unpaid";
}

export default function MobileSaleCard({ sale, c_display_name, c_identifier }: { sale: SaleDto; c_display_name?: string; c_identifier?: string }) {
    const navigate = useNavigate();
    const status = saleStatus(sale);
    const ch = apiToUiChannel(sale.channel as ApiSalesChannel);
    const deliveryStatus = (sale.delivery_status as DeliveryStatus)?.toLowerCase() || "processing";
    const bal = Number(sale.total_amount) - Number(sale.total_paid);
    const itemsCount = sale.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;

    return (
        <Card key={sale.id} className="cursor-pointer">
            <CardContent className="px-4 py-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{sale.reference}</span>
                            <Badge variant={status === "paid" ? "success" : status === "partial" ? "default" : "destructive"} className="text-[10px]">
                                {status}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{formatDate(sale.created_at)}</p>
                    </div>
                    <DeliveryBadge status={(deliveryStatus as DeliveryStatus) || ("processing" as DeliveryStatus)} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <button className="text-sm font-medium text-left hover:underline" onClick={() => navigate(`/customers/${sale.customer_id}`)}>
                            {c_display_name}
                        </button>

                        <p className="text-xs text-muted-foreground font-mono">
                            {c_identifier} · {channelLabels[ch]}
                        </p>
                    </div>

                    <div className="text-right space-y-1">
                        <p className="font-semibold text-sm">{currency(sale.total_amount)}</p>
                        {status !== "paid" && <p className="text-xs text-destructive">Bal: {currency(bal)}</p>}
                        <SalePaymentsDetails saleId={sale.id} customerId={sale.customer_id} saleTotal={sale.total_amount} />
                    </div>
                </div>

                {deliveryStatus !== "processing" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>
                            {deliveryStatus === "out_for_delivery" ? `Out for delivery • ${sale.delivery_assigned_to || "Unassigned"}` : "Delivered"}
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <SalesDetails label={`${itemsCount} items`} items={sale.items || []} total={sale.total_amount} />
                    <SalesActions sale={sale} displayName={c_display_name || ""} status={status} />
                </div>
            </CardContent>
        </Card>
    );
}
