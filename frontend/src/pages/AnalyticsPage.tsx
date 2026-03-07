import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from "recharts";
import { currency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsTrends, getAnalyticsStock, getTopCustomers, getChannelStats } from "@/lib/api";

// colours reused across multiple pie charts
const PIE_COLORS = [
    "hsl(25, 75%, 47%)",
    "hsl(152, 60%, 40%)",
    "hsl(38, 92%, 50%)",
    "hsl(30, 10%, 46%)",
];

const tooltipStyle = {
    backgroundColor: "hsl(40, 25%, 99%)",
    border: "1px solid hsl(35, 18%, 88%)",
    borderRadius: "0.75rem",
    fontSize: "0.75rem",
};

export default function AnalyticsPage() {

    const [period, setPeriod] = useState("monthly");

    const { data: trends } = useQuery({
        queryKey: ["analytics", "trends", period],
        queryFn: () => getAnalyticsTrends(period as "weekly" | "monthly"),
    });

    const { data: stock } = useQuery({
        queryKey: ["analytics", "stock"],
        queryFn: getAnalyticsStock,
    });

    const { data: topCustomers } = useQuery({
        queryKey: ["analytics", "top-customers"],
        queryFn: () => getTopCustomers(5),
    });

    const { data: channels } = useQuery({
        queryKey: ["analytics", "channels"],
        queryFn: getChannelStats,
    });

    // handleExport and return logic moved further below
    
    const handleExport = () => {
        const headers = ["Period", "Revenue", "Cost", "Profit"];
        const rows =
            trends?.points?.map((p) => [
                p.period_start,
                p.total_amount,
                p.total_cost ?? 0,
                p.total_profit ?? 0,
            ]) ?? [];
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ims-report.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Analytics</h1>
                    <p className="page-subtitle">Deep dive into your shop performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">Revenue & Cost Trend</CardTitle>
                    <CardDescription>Revenue vs cost breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={
                                    trends?.points?.map((p) => ({
                                        month: new Date(p.period_start + "Z").toLocaleDateString("default", {
                                            month: "short",
                                            year: "numeric",
                                        }),
                                        revenue: p.total_amount,
                                        cost: p.total_cost ?? 0,
                                    })) ?? []
                                }
                            >
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(25, 75%, 47%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(25, 75%, 47%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="month" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} />
                                <YAxis domain={[0, 2000000]} tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 40%)" fill="url(#gradRevenue)" strokeWidth={2} />
                                <Area type="monotone" dataKey="cost" stroke="hsl(25, 75%, 47%)" fill="url(#gradCost)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Stock by Category</CardTitle>
                        <CardDescription>Category-level inventory snapshot</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stock?.categories || []}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="category" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} />
                                    <YAxis tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 12 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="quantity" fill="hsl(25, 75%, 47%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Sales by Channel</CardTitle>
                        <CardDescription>Distribution of sales across channels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={
                                            channels?.map((ch, i) => ({
                                                name: ch.channel,
                                                value: ch.count,
                                                color: PIE_COLORS[i % PIE_COLORS.length],
                                            })) || []
                                        }
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {channels?.map((entry, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-2">
                            {channels?.map((ch, i) => (
                                <div key={ch.channel} className="flex items-center gap-1.5 text-xs">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-muted-foreground">{ch.channel}</span>
                                    <span className="font-medium">{ch.percentage.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topCustomers?.map((c, i) => (
                                <div key={c.customer_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{c.display_name}</p>
                                            <p className="text-xs text-muted-foreground">{c.purchases} purchases</p>
                                        </div>
                                    </div>
                                    <span className="font-heading font-bold text-sm">{currency(c.spent)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
