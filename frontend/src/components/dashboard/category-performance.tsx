import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listSales, getAnalyticsSummary, listCategories, type ApiSalesChannel, type CategoryDto } from "@/lib/api";
import { Channel, channelLabels } from "@/types/customer";
import { currency } from "@/lib/utils";

const PIE_COLORS = ["hsl(25, 75%, 47%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(30, 10%, 46%)", "hsl(220, 70%, 50%)"];

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

export default function CategoryPerformance() {
    const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });
    const { data: summary } = useQuery({ queryKey: ["analytics", "summary"], queryFn: getAnalyticsSummary });
    const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

    const derivedRevenueFromSales = useMemo(() => sales.reduce((a, s) => a + Number(s.total_amount ?? 0), 0), [sales]);
    const summaryRevenue = summary ? Number(summary.total_revenue ?? 0) : 0;
    const totalRevenue = summaryRevenue || derivedRevenueFromSales;

    const { categoryBreakdown, stats } = useMemo(() => {
        if (!sales.length) {
            return {
                categoryBarData: [] as { category: string; revenue: number }[],
                categoryBreakdown: [] as {
                    name: string;
                    value: number;
                    quantity: number;
                    color: string;
                }[],
                stats: { totalRevenue },
            };
        }

        const categoryNameById = new Map<number, string>((categories as CategoryDto[]).map((c) => [c.id, c.name]));

        const byCategory: Record<number, { name: string; revenue: number; quantity: number }> = {};

        for (const sale of sales) {
            if (!sale.items) continue;
            for (const item of sale.items) {
                const catId = item.category_id;
                const name = categoryNameById.get(catId) ?? `Category ${catId}`;
                const entry = byCategory[catId] ?? { name, revenue: 0, quantity: 0 };
                entry.revenue += Number(item.amount ?? 0);
                entry.quantity += Number(item.quantity ?? 0);
                byCategory[catId] = entry;
            }
        }

        const entries = Object.values(byCategory);
        const totalRevenueCat = entries.reduce((sum, e) => sum + e.revenue, 0);

        const breakdown = entries.map((e, idx) => ({
            name: e.name,
            value: e.revenue,
            quantity: e.quantity,
            color: PIE_COLORS[idx % PIE_COLORS.length],
        }));

        const barData = breakdown.map((e) => ({
            category: e.name,
            revenue: e.value,
        }));

        return {
            categoryBarData: barData,
            categoryBreakdown: breakdown,
            stats: { totalRevenue: totalRevenueCat },
        };
    }, [sales, categories]);

    const channelData = useMemo(() => {
        const byChannel: Record<string, { sales: number; revenue: number }> = {
            shop: { sales: 0, revenue: 0 },
            tiktok: { sales: 0, revenue: 0 },
            instagram: { sales: 0, revenue: 0 },
            website: { sales: 0, revenue: 0 },
        };
        sales.forEach((s) => {
            const ch = apiToUiChannel(s.channel as ApiSalesChannel);
            if (!byChannel[ch]) byChannel[ch] = { sales: 0, revenue: 0 };
            byChannel[ch].sales += 1;
            byChannel[ch].revenue += Number(s.total_amount);
        });
        return [
            { channel: channelLabels.shop, sales: byChannel.shop.sales, revenue: byChannel.shop.revenue },
            { channel: channelLabels.tiktok, sales: byChannel.tiktok.sales, revenue: byChannel.tiktok.revenue },
            { channel: channelLabels.instagram, sales: byChannel.instagram.sales, revenue: byChannel.instagram.revenue },
            { channel: channelLabels.website, sales: byChannel.website.sales, revenue: byChannel.website.revenue },
        ];
    }, [sales]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Category Detail Table */}
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">Category Performance</CardTitle>
                    <CardDescription>Detailed breakdown per category</CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    {/* MOBILE VIEW */}
                    <div className="md:hidden space-y-3 p-3">
                        {categoryBreakdown.map((cat) => {
                            const share = stats.totalRevenue > 0 ? ((cat.value / stats.totalRevenue) * 100).toFixed(1) : "0";

                            const avgPerItem = cat.quantity > 0 ? (cat.value / cat.quantity).toFixed(0) : "0";

                            return (
                                <div key={cat.name} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="font-semibold">{cat.name}</span>
                                        </div>

                                        <span className="text-sm font-medium">{currency(cat.value) || 0}</span>
                                    </div>

                                    <div className="grid grid-cols-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Qty</p>
                                            <p className="font-medium">{cat.quantity}</p>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground text-xs">Avg</p>
                                            <p className="font-medium">{currency(Number(avgPerItem)) || 0}</p>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground text-xs">Share</p>
                                            <p className="font-medium">{share}%</p>
                                        </div>
                                    </div>

                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${share}%`,
                                                backgroundColor: cat.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Revenue</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Qty Sold</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Avg / Item</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Share</th>
                                </tr>
                            </thead>

                            <tbody>
                                {categoryBreakdown.map((cat) => {
                                    const share = stats.totalRevenue > 0 ? ((cat.value / stats.totalRevenue) * 100).toFixed(1) : "0";

                                    const avgPerItem = cat.quantity > 0 ? (cat.value / cat.quantity).toFixed(0) : "0";

                                    return (
                                        <tr key={cat.name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    <span className="font-medium">{cat.name}</span>
                                                </div>
                                            </td>

                                            <td className="p-3 font-medium">{currency(cat.value) || 0}</td>

                                            <td className="p-3">{cat.quantity}</td>

                                            <td className="p-3 text-muted-foreground">{currency(Number(avgPerItem)) || 0}</td>

                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${share}%`,
                                                                backgroundColor: cat.color,
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="text-xs text-muted-foreground">{share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            {/* Channel breakdown */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">Sales by Channel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {channelData.map((ch) => (
                        <div key={ch.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                                <p className="text-sm font-medium">{ch.channel}</p>
                                <p className="text-xs text-muted-foreground">{ch.sales} sales</p>
                            </div>
                            <p className="font-heading font-bold text-sm">{currency(ch.revenue)}</p>
                        </div>
                    ))}
                    {channelData.every((ch) => ch.sales === 0) && <p className="text-sm text-muted-foreground py-2">No sales by channel yet</p>}
                </CardContent>
            </Card>
        </div>
    );
}
