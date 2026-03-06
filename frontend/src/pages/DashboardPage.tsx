import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
    listSales,
    listCustomers,
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAnalyticsStock,
    listCategories,
    type SaleDto,
    type ApiSalesChannel,
    type CategoryDto,
} from "@/lib/api";
import { Channel, channelLabels } from "@/types/customer";
import { currency } from "@/lib/utils";
import { AlertTriangle, DollarSign, Package, ShoppingCart } from "lucide-react";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["hsl(25, 75%, 47%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(30, 10%, 46%)", "hsl(220, 70%, 50%)"];
const LOW_STOCK_THRESHOLD = 15;

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

export default function DashboardPage() {
    const navigate = useNavigate();

    const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });
    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
    const { data: summary } = useQuery({ queryKey: ["analytics", "summary"], queryFn: getAnalyticsSummary });
    const { data: trends } = useQuery({ queryKey: ["analytics", "trends", "monthly"], queryFn: () => getAnalyticsTrends("monthly") });
    const { data: stock } = useQuery({ queryKey: ["analytics", "stock"], queryFn: getAnalyticsStock });
    const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

    const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

    const derivedRevenueFromSales = useMemo(() => sales.reduce((a, s) => a + Number(s.total_amount ?? 0), 0), [sales]);
    const summaryRevenue = summary ? Number(summary.total_revenue ?? 0) : 0;
    const totalRevenue = summaryRevenue || derivedRevenueFromSales;
    const totalOutstanding = useMemo(() => sales.reduce((a, s) => a + Number(s.balance), 0), [sales]);
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const salesThisMonth = useMemo(() => sales.filter((s) => s.sale_date && s.sale_date.startsWith(thisMonthKey)).length, [sales, thisMonthKey]);
    const totalStock = stock?.total_stock ?? 0;

    const revenueData = useMemo(() => {
        if (trends?.points?.length) {
            return trends.points.map((p) => ({
                month: MONTH_LABELS[new Date(p.period_start + "Z").getUTCMonth()] ?? String(p.period_start).slice(0, 7),
                revenue: Number(p.total_amount),
                sales: 0,
            }));
        }
        // Fallback: derive from sales when trends API is empty (e.g. new deployment)
        if (!sales.length) return [];
        const byMonth: Record<string, number> = {};
        sales.forEach((s) => {
            const key = (s.sale_date || s.created_at || "").slice(0, 7);
            if (!key) return;
            byMonth[key] = (byMonth[key] ?? 0) + Number(s.total_amount);
        });
        const sortedKeys = Object.keys(byMonth).sort();
        return sortedKeys.map((key) => {
            const [y, m] = key.split("-").map(Number);
            const monthLabel = MONTH_LABELS[(m ?? 1) - 1] ?? key;
            const yearSuffix = y ? ` '${String(y).slice(-2)}` : "";
            return {
                month: monthLabel + yearSuffix,
                revenue: byMonth[key] ?? 0,
                sales: 0,
            };
        });
    }, [trends, sales]);

    const categoryData = useMemo(() => {
        if (!stock?.categories?.length) return [];
        return stock.categories.map((cat, i) => ({
            name: cat.category,
            value: cat.quantity,
            color: PIE_COLORS[i % PIE_COLORS.length],
        }));
    }, [stock]);

    const { categoryBarData, categoryBreakdown, stats } = useMemo(() => {
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

    const recentTransactions = useMemo(() => {
        const sorted = [...sales].sort((a, b) => (b.sale_date || b.created_at).localeCompare(a.sale_date || a.created_at));
        return sorted.slice(0, 8).map((s) => {
            const c = customerMap.get(s.customer_id);
            const itemsCount = s.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
            return {
                id: s.id,
                customerId: s.customer_id,
                customerName: c?.display_name ?? "—",
                itemsCount,
                amount: Number(s.total_amount),
                status: saleStatus(s),
                channelLabel: channelLabels[apiToUiChannel(s.channel as ApiSalesChannel)],
            };
        });
    }, [sales, customerMap]);

    const lowStockAlerts = useMemo(() => {
        if (!stock?.categories?.length) return [];
        return stock.categories
            .filter((cat) => cat.quantity < LOW_STOCK_THRESHOLD)
            .map((cat) => ({ category: cat.category, remaining: cat.quantity, threshold: LOW_STOCK_THRESHOLD }));
    }, [stock]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">Dashboard</h1>
                <p className="page-subtitle">Overview of your shop performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Stock" value={String(totalStock)} change="Current inventory" changeType="positive" icon={Package} />
                <StatCard
                    label="Total Revenue"
                    value={currency(totalRevenue)}
                    change="All time"
                    changeType="positive"
                    icon={DollarSign}
                    iconColor="bg-success/10 text-success"
                />
                <StatCard
                    label="Outstanding"
                    value={currency(totalOutstanding)}
                    change={sales.filter((s) => Number(s.balance) > 0).length + " pending"}
                    changeType={totalOutstanding > 0 ? "negative" : "positive"}
                    icon={AlertTriangle}
                    iconColor="bg-destructive/10 text-destructive"
                />
                <StatCard
                    label="Sales This Month"
                    value={String(salesThisMonth)}
                    change="Current month"
                    changeType="positive"
                    icon={ShoppingCart}
                    iconColor="bg-warning/10 text-warning"
                />
            </div>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="font-heading font-semibold text-sm">Low Stock Alerts</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {lowStockAlerts.map((alert) => (
                                <Badge key={alert.category} variant="destructive" className="font-normal">
                                    {alert.category}: {alert.remaining} left (min: {alert.threshold})
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts Row: Category Revenue Bar + Category Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Category Revenue Bar Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Revenue by Category</CardTitle>
                        <CardDescription>Sales amount breakdown across categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryBarData} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} tickFormatter={(v) => `${currency(v)}`} />
                                    <YAxis type="category" dataKey="category" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} width={80} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(40, 25%, 99%)",
                                            border: "1px solid hsl(35, 18%, 88%)",
                                            borderRadius: "0.75rem",
                                            fontSize: "0.75rem",
                                        }}
                                        formatter={(value: number, name: string) => [
                                            name === "revenue" ? `$${value}` : value,
                                            name === "revenue" ? "Revenue" : "Qty Sold",
                                        ]}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(25, 75%, 47%)" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Pie */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Category Mix</CardTitle>
                        <CardDescription>Revenue share by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {categoryBreakdown.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`${currency(value) || 0}`, "Revenue"]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {categoryBreakdown.map((cat) => (
                                <div key={cat.name} className="flex items-center gap-2 text-xs">
                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    <span className="text-muted-foreground truncate">{cat.name}</span>
                                    <span className="ml-auto font-medium">{currency(cat.value) || 0}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Detail Table + Channel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Category Detail Table */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Category Performance</CardTitle>
                        <CardDescription>Detailed breakdown per category</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
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
                                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
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
                                                            style={{ width: `${share}%`, backgroundColor: cat.color }}
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

            {/* Recent Transactions */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/sales")}>
                            View All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="text-left py-2 font-medium">ID</th>
                                    <th className="text-left py-2 font-medium">Customer</th>
                                    <th className="text-left py-2 font-medium hidden sm:table-cell">Categories</th>
                                    <th className="text-left py-2 font-medium">Amount</th>
                                    <th className="text-left py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">
                                            No transactions yet
                                        </td>
                                    </tr>
                                )}
                                {recentTransactions.map((txn) => (
                                    <tr
                                        key={txn.id}
                                        className="border-b last:border-0 cursor-pointer hover:bg-muted/20"
                                        onClick={() => txn.customerId && navigate(`/customers/${txn.customerId}`)}
                                    >
                                        <td className="py-2.5 font-mono text-xs">{txn.id}</td>
                                        <td className="py-2.5">{txn.customerName ?? "Unknown"}</td>
                                        <td className="py-2.5 hidden sm:table-cell">
                                            {txn.itemsCount} item{txn.itemsCount === 1 ? "" : "s"}
                                        </td>
                                        <td className="py-2.5 font-medium">{currency(txn.amount)}</td>
                                        <td className="py-2.5">
                                            <Badge
                                                variant={txn.status === "paid" ? "default" : txn.status === "partial" ? "secondary" : "destructive"}
                                                className="text-xs font-normal"
                                            >
                                                {txn.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Revenue & Sales</CardTitle>
                        <CardDescription>Monthly performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)" }} />
                                        <YAxis className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)" }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(40, 25%, 99%)",
                                                border: "1px solid hsl(35, 18%, 88%)",
                                                borderRadius: "0.75rem",
                                                fontSize: "0.75rem",
                                            }}
                                            formatter={(value: number) => [currency(value), "Revenue"]}
                                        />
                                        <Bar dataKey="revenue" fill="hsl(25, 75%, 47%)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Stock by Category</CardTitle>
                        <CardDescription>Current inventory breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                            {categoryData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [value, "Items"]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No stock data yet</div>
                            )}
                        </div>
                        {categoryData.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {categoryData.map((cat) => (
                                    <div key={cat.name} className="flex items-center gap-2 text-xs">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="text-muted-foreground truncate">{cat.name}</span>
                                        <span className="ml-auto font-medium shrink-0">{cat.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
