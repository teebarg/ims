import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard, ShoppingCart, DollarSign } from "lucide-react";
import { channelLabels } from "@/types/customer";
import { listSales, listCustomers, type SaleDto, type ApiSalesChannel } from "@/lib/api";
import { currency } from "@/lib/utils";
import SalesForm from "@/components/sales/sales-form";
import { Channel } from "@/types/customer";
import PaymentForm from "@/components/sales/payment-form";

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

export default function SalesPage() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });
    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const filtered = sales.filter((s) => {
        const c = customerMap.get(s.customer_id);
        const name = c?.display_name ?? "";
        const ident = c?.identifier ?? "";
        const matchSearch =
            name.toLowerCase().includes(search.toLowerCase()) || ident.toLowerCase().includes(search.toLowerCase()) || String(s.id).includes(search);
        const ch = apiToUiChannel(s.channel as ApiSalesChannel);
        const matchChannel = filterChannel === "all" || ch === filterChannel;
        const status = saleStatus(s);
        const matchStatus = filterStatus === "all" || status === filterStatus;
        return matchSearch && matchChannel && matchStatus;
    });

    const totalRevenue = sales.reduce((a, s) => a + Number(s.total_amount), 0);
    const totalCollected = sales.reduce((a, s) => a + Number(s.total_paid), 0);
    const totalOutstanding = totalRevenue - totalCollected;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Sales & Payments</h1>
                    <p className="page-subtitle">Record sales and manage payments</p>
                </div>
                <SalesForm />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="metric-label">Total Sales</p>
                            <p className="metric-value text-xl">{sales.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                            <DollarSign className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="metric-label">Collected</p>
                            <p className="metric-value text-xl text-success">{currency(totalCollected)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                            <CreditCard className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="metric-label">Outstanding</p>
                            <p className="metric-value text-xl text-destructive">{currency(totalOutstanding)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search sales..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="tiktok">Tiktok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Paid</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((sale) => {
                                    const c = customerMap.get(sale.customer_id);
                                    const status = saleStatus(sale);
                                    const ch = apiToUiChannel(sale.channel as ApiSalesChannel);
                                    return (
                                        <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-mono text-xs">{sale.id}</td>
                                            <td className="p-3 text-xs">{sale.sale_date}</td>
                                            <td className="p-3">
                                                <button
                                                    className="text-left hover:underline"
                                                    onClick={() => navigate(`/customers/${sale.customer_id}`)}
                                                >
                                                    <span className="font-medium">{c?.display_name}</span>
                                                    <span className="block text-xs text-muted-foreground font-mono">{c?.identifier}</span>
                                                </button>
                                            </td>
                                            <td className="p-3 text-xs">{channelLabels[ch]}</td>
                                            <td className="p-3">
                                                {sale.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0}
                                            </td>
                                            <td className="p-3 font-medium">{currency(sale.total_amount)}</td>
                                            <td className="p-3">{currency(sale.total_paid)}</td>
                                            <td className="p-3">
                                                <Badge
                                                    variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                                    className="text-xs font-normal"
                                                >
                                                    {status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                {status !== "paid" && <PaymentForm sale={sale} displayName={c?.display_name || ""} />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <div className="md:hidden space-y-3">
                {filtered.map((sale) => {
                    const c = customerMap.get(sale.customer_id);
                    const status = saleStatus(sale);
                    const ch = apiToUiChannel(sale.channel as ApiSalesChannel);
                    const bal = Number(sale.total_amount) - Number(sale.total_paid);
                    return (
                        <Card key={sale.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-medium">{sale.id}</span>
                                        <Badge
                                            variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                            className="text-xs"
                                        >
                                            {status}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{sale.sale_date}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{c?.display_name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {c?.identifier} · {channelLabels[ch]}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-heading font-bold">{currency(sale.total_amount)}</p>
                                        {status !== "paid" && <p className="text-xs text-destructive">Bal: {currency(bal)}</p>}
                                    </div>
                                </div>
                                {status !== "paid" && <PaymentForm sale={sale} displayName={c?.display_name || ""} />}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
