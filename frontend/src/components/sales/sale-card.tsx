import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard, ShoppingCart, DollarSign, Truck } from "lucide-react";
import { apiToDeliveryStatus, channelLabels, type DeliveryStatus } from "@/types/customer";
import { listSales, listCustomers, type SaleDto, type ApiSalesChannel } from "@/lib/api";
import { currency, formatDate } from "@/lib/utils";
import SalesForm from "@/components/sales/sales-form";
import { Channel } from "@/types/customer";
import SalesDetails from "@/components/sales/sales-details";
import SalePaymentsDetails from "@/components/sales/sale-payments-details";
import DeliveryBadge from "@/components/sales/delivery-badge";
import SalesActions from "@/components/sales/sales-actions";
import { ZeroState } from "@/components/ZeroState";
import MobileSaleCard from "@/components/sales/mobile-sale-card";

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

export default function SaleCard({ sales, c_display_name, c_identifier }: { sales: SaleDto[]; c_display_name?: string; c_identifier?: string }) {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterDelivery, setFilterDelivery] = useState<string>("all");
    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return (
        <Card>
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium text-muted-foreground">Ref</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Paid</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Delivery</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale: SaleDto) => {
                            const c = customerMap.get(sale.customer_id);
                            const status = saleStatus(sale);
                            const ch = apiToUiChannel(sale.channel as ApiSalesChannel);
                            return (
                                <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-mono text-xs">{sale.reference}</td>
                                    <td className="p-3 text-xs">{sale.sale_date}</td>
                                    <td className="p-3">
                                        <button className="text-left hover:underline" onClick={() => navigate(`/customers/${sale.customer_id}`)}>
                                            <span className="font-medium">{c_display_name}</span>
                                            <span className="block text-xs text-muted-foreground font-mono">{c_identifier}</span>
                                        </button>
                                    </td>
                                    <td className="p-3 text-xs">{channelLabels[ch]}</td>
                                    <td className="p-3">
                                        <SalesDetails
                                            label={`${sale.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0} items`}
                                            items={sale.items || []}
                                            total={sale.total_amount}
                                        />
                                    </td>
                                    <td className="p-3 font-medium">{currency(sale.total_amount)}</td>
                                    <td className="p-3 space-y-1">
                                        <div>{currency(sale.total_paid)}</div>
                                        <SalePaymentsDetails saleId={sale.id} customerId={sale.customer_id} saleTotal={sale.total_amount} />
                                    </td>
                                    <td className="p-3">
                                        <Badge
                                            variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                            className="text-xs font-normal"
                                        >
                                            {status}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <DeliveryBadge status={apiToDeliveryStatus(sale.delivery_status)} />
                                    </td>
                                    <td className="p-3">
                                        <SalesActions sale={sale} displayName={c_display_name || ""} status={status} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
