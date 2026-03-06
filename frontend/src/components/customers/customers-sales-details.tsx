import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { channelLabels } from "@/types/customer";
import { type ApiSalesChannel, SaleDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Channel } from "@/types/customer";
import PaymentForm from "../sales/payment-form";

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

export default function CustomerSalesDetails({ sales }: { sales: SaleDto[] }) {
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
                                <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Paid</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {sales.map((s) => {
                                const status = Number(s.balance) <= 0 ? "paid" : Number(s.total_paid) > 0 ? "partial" : "unpaid";

                                const channelUi = apiToUiChannel(s.channel as ApiSalesChannel);

                                return (
                                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-mono text-xs">{s.id}</td>
                                        <td className="p-3 text-xs">{s.sale_date}</td>
                                        <td className="p-3 text-xs">{channelLabels[channelUi]}</td>
                                        <td className="p-3 font-medium">{currency(s.total_amount)}</td>
                                        <td className="p-3">{currency(s.total_paid)}</td>
                                        <td className="p-3">
                                            <Badge
                                                variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                                className="text-xs font-normal"
                                            >
                                                {status}
                                            </Badge>
                                        </td>
                                        <td className="p-3">{status !== "paid" && <PaymentForm sale={s} displayName={""} />}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y">
                    {sales.map((s) => {
                        const status = Number(s.balance) <= 0 ? "paid" : Number(s.total_paid) > 0 ? "partial" : "unpaid";

                        const channelUi = apiToUiChannel(s.channel as ApiSalesChannel);

                        return (
                            <div key={s.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="font-mono text-xs text-muted-foreground">{s.id}</div>

                                        <div className="text-xs text-muted-foreground">{s.sale_date}</div>
                                    </div>

                                    <Badge
                                        variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                        className="text-xs"
                                    >
                                        {status}
                                    </Badge>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Channel</span>
                                    <span>{channelLabels[channelUi]}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-medium">{currency(s.total_amount)}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid</span>
                                    <span>{currency(s.total_paid)}</span>
                                </div>

                                {status !== "paid" && <PaymentForm sale={s} displayName={""} />}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
