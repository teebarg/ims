import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiToDeliveryStatus, channelLabels } from "@/types/customer";
import { type ApiSalesChannel, SaleDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Channel } from "@/types/customer";
import PaymentFormTrigger from "../sales/payment-form-trigger";
import MobileSaleCard from "../sales/mobile-sale-card";
import SalesActions from "../sales/sales-actions";
import DeliveryBadge from "../sales/delivery-badge";
import SalePaymentsDetails from "../sales/sale-payments-details";
import SalesDetails from "../sales/sales-details";

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

export default function CustomerSalesDetails({ sales, customer }: { sales: SaleDto[]; customer: any }) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading">Sales History</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3 font-medium text-muted-foreground">Ref</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
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
                            {sales.map((sale) => {
                                const status = Number(sale.balance) <= 0 ? "paid" : Number(sale.total_paid) > 0 ? "partial" : "unpaid";

                                const channelUi = apiToUiChannel(sale.channel as ApiSalesChannel);

                                return (
                                    <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-mono text-xs">{sale.reference}</td>
                                        <td className="p-3 text-xs">{sale.sale_date}</td>
                                        <td className="p-3 text-xs">{channelLabels[channelUi]}</td>
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
                                            <SalesActions sale={sale} displayName={customer?.display_name || ""} status={status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y">
                    {sales.map((s) => {
                        return <MobileSaleCard key={s.id} sale={s} c_display_name={customer?.display_name} c_identifier={customer?.identifier} />;
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
