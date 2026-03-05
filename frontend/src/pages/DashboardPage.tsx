import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, AlertTriangle, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight, Shirt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const revenueData = [
    { month: "Jan", revenue: 4200, sales: 68 },
    { month: "Feb", revenue: 5800, sales: 92 },
    { month: "Mar", revenue: 4900, sales: 76 },
    { month: "Apr", revenue: 7200, sales: 110 },
    { month: "May", revenue: 6100, sales: 95 },
    { month: "Jun", revenue: 8400, sales: 128 },
];

const categoryData = [
    { name: "Shirts", value: 420, color: "hsl(25, 75%, 47%)" },
    { name: "Pants", value: 280, color: "hsl(152, 60%, 40%)" },
    { name: "Jackets", value: 150, color: "hsl(38, 92%, 50%)" },
    { name: "Others", value: 95, color: "hsl(30, 10%, 46%)" },
];

const channelData = [
    { channel: "Shop", sales: 542, revenue: 18200 },
    { channel: "Social Media", sales: 284, revenue: 9800 },
    { channel: "Website", sales: 198, revenue: 7400 },
];

const recentTransactions = [
    { id: "TXN-001", customer: "Sarah K.", items: 5, amount: 125, status: "paid", channel: "Shop" },
    { id: "TXN-002", customer: "Guest", items: 3, amount: 78, status: "partial", channel: "Social Media" },
    { id: "TXN-003", customer: "James M.", items: 8, amount: 210, status: "paid", channel: "Website" },
    { id: "TXN-004", customer: "Guest", items: 2, amount: 45, status: "unpaid", channel: "Shop" },
    { id: "TXN-005", customer: "Amina L.", items: 6, amount: 168, status: "paid", channel: "Shop" },
];

const lowStockAlerts = [
    { category: "Jackets", remaining: 12, threshold: 20 },
    { category: "Pants (Kids)", remaining: 5, threshold: 15 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">Dashboard</h1>
                <p className="page-subtitle">Overview of your thrift shop performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Stock" value="945" change="+48 from last bale" changeType="positive" icon={Package} />
                <StatCard
                    label="Total Revenue"
                    value="$35,400"
                    change="+12.5% vs last month"
                    changeType="positive"
                    icon={DollarSign}
                    iconColor="bg-success/10 text-success"
                />
                <StatCard
                    label="Outstanding"
                    value="$1,240"
                    change="8 pending payments"
                    changeType="negative"
                    icon={AlertTriangle}
                    iconColor="bg-destructive/10 text-destructive"
                />
                <StatCard
                    label="Sales This Month"
                    value="128"
                    change="+18% vs last month"
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Revenue & Sales</CardTitle>
                        <CardDescription>Monthly performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
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
                                    />
                                    <Bar dataKey="revenue" fill="hsl(25, 75%, 47%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-heading">Stock by Category</CardTitle>
                        <CardDescription>Current inventory breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {categoryData.map((cat) => (
                                <div key={cat.name} className="flex items-center gap-2 text-xs">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span className="text-muted-foreground">{cat.name}</span>
                                    <span className="ml-auto font-medium">{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sales by Channel + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                <p className="font-heading font-bold text-sm">${ch.revenue.toLocaleString()}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs">
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
                                        <th className="text-left py-2 font-medium hidden sm:table-cell">Items</th>
                                        <th className="text-left py-2 font-medium">Amount</th>
                                        <th className="text-left py-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((txn) => (
                                        <tr key={txn.id} className="border-b last:border-0">
                                            <td className="py-2.5 font-mono text-xs">{txn.id}</td>
                                            <td className="py-2.5">{txn.customer}</td>
                                            <td className="py-2.5 hidden sm:table-cell">{txn.items}</td>
                                            <td className="py-2.5 font-medium">${txn.amount}</td>
                                            <td className="py-2.5">
                                                <Badge
                                                    variant={
                                                        txn.status === "paid" ? "default" : txn.status === "partial" ? "secondary" : "destructive"
                                                    }
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
            </div>
        </div>
    );
}
