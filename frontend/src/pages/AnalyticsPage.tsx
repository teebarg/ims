import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const weeklyData = [
    { week: "W1", sales: 42, revenue: 1260 },
    { week: "W2", sales: 58, revenue: 1740 },
    { week: "W3", sales: 35, revenue: 1050 },
    { week: "W4", sales: 72, revenue: 2160 },
];

const monthlyTrend = [
    { month: "Oct", revenue: 3200, cost: 1800, profit: 1400 },
    { month: "Nov", revenue: 4800, cost: 2200, profit: 2600 },
    { month: "Dec", revenue: 6200, cost: 2800, profit: 3400 },
    { month: "Jan", revenue: 5100, cost: 2400, profit: 2700 },
    { month: "Feb", revenue: 5800, cost: 2500, profit: 3300 },
    { month: "Mar", revenue: 8400, cost: 3000, profit: 5400 },
];

const categoryTrend = [
    { month: "Oct", shirts: 180, pants: 120, jackets: 60, others: 40 },
    { month: "Nov", shirts: 200, pants: 140, jackets: 80, others: 50 },
    { month: "Dec", shirts: 240, pants: 160, jackets: 100, others: 60 },
    { month: "Jan", shirts: 190, pants: 130, jackets: 70, others: 45 },
    { month: "Feb", shirts: 210, pants: 150, jackets: 85, others: 55 },
    { month: "Mar", shirts: 260, pants: 170, jackets: 90, others: 65 },
];

const baleProfit = [
    { bale: "BL-001", cost: 480, revenue: 1200, profit: 720, margin: "60%" },
    { bale: "BL-002", cost: 320, revenue: 950, profit: 630, margin: "66%" },
    { bale: "BL-003", cost: 750, revenue: 200, profit: -550, margin: "-73%" },
    { bale: "BL-004", cost: 240, revenue: 780, profit: 540, margin: "69%" },
];

const topCustomers = [
    { name: "Sarah K.", purchases: 18, spent: 540 },
    { name: "James M.", purchases: 14, spent: 420 },
    { name: "Amina L.", purchases: 12, spent: 380 },
    { name: "David O.", purchases: 9, spent: 270 },
    { name: "Guests", purchases: 62, spent: 1860 },
];

const channelPie = [
    { name: "Shop", value: 55, color: "hsl(25, 75%, 47%)" },
    { name: "Tiktok", value: 28, color: "hsl(152, 60%, 40%)" },
    { name: "Instagram", value: 12, color: "hsl(38, 92%, 50%)" },
    { name: "Website", value: 5, color: "hsl(210, 60%, 50%)" },
];

const tooltipStyle = {
    backgroundColor: 'hsl(40, 25%, 99%)',
    border: '1px solid hsl(35, 18%, 88%)',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
};

export default function AnalyticsPage() {
    const [period, setPeriod] = useState("monthly");

    const handleExport = () => {
        const headers = ["Bale", "Cost", "Revenue", "Profit", "Margin"];
        const rows = baleProfit.map(b => [b.bale, b.cost, b.revenue, b.profit, b.margin]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "thriftstock-report.csv";
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
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
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

            {/* Revenue & Profit Trend */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">Revenue & Profit Trend</CardTitle>
                    <CardDescription>Monthly revenue vs cost breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTrend}>
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(25, 75%, 47%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(25, 75%, 47%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="month" tick={{ fill: 'hsl(30, 8%, 46%)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'hsl(30, 8%, 46%)', fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(25, 75%, 47%)" fill="url(#gradRevenue)" strokeWidth={2} />
                                <Area type="monotone" dataKey="profit" stroke="hsl(152, 60%, 40%)" fill="url(#gradProfit)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category Stock Trends */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Stock by Category</CardTitle>
                        <CardDescription>Category-level inventory trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={categoryTrend}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="month" tick={{ fill: 'hsl(30, 8%, 46%)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'hsl(30, 8%, 46%)', fontSize: 12 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line type="monotone" dataKey="shirts" stroke="hsl(25, 75%, 47%)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="pants" stroke="hsl(152, 60%, 40%)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="jackets" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="others" stroke="hsl(30, 8%, 46%)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {[
                                { label: "Shirts", color: "hsl(25, 75%, 47%)" },
                                { label: "Pants", color: "hsl(152, 60%, 40%)" },
                                { label: "Jackets", color: "hsl(38, 92%, 50%)" },
                                { label: "Others", color: "hsl(30, 8%, 46%)" },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-1.5 text-xs">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                                    <span className="text-muted-foreground">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Channel Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Sales by Channel</CardTitle>
                        <CardDescription>Distribution of sales across channels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={channelPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {channelPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-2">
                            {channelPie.map(ch => (
                                <div key={ch.name} className="flex items-center gap-1.5 text-xs">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                                    <span className="text-muted-foreground">{ch.name}</span>
                                    <span className="font-medium">{ch.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bale Profitability */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Bale Profitability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {baleProfit.map(b => (
                                <div key={b.bale} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <div>
                                        <p className="font-mono text-xs font-medium">{b.bale}</p>
                                        <p className="text-xs text-muted-foreground">Cost: ${b.cost} → Rev: ${b.revenue}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-heading font-bold text-sm ${b.profit >= 0 ? "status-success" : "status-danger"}`}>
                                            {b.profit >= 0 ? "+" : ""}${b.profit}
                                        </span>
                                        {b.profit >= 0 ? (
                                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                                        ) : (
                                            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topCustomers.map((c, i) => (
                                <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.purchases} purchases</p>
                                        </div>
                                    </div>
                                    <span className="font-heading font-bold text-sm">${c.spent}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
