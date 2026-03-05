import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, DollarSign, AlertCircle } from "lucide-react";
import { identifierTypeLabels, type IdentifierType } from "@/types/customer";
import { listCustomers, type CustomerDto } from "@/lib/api";
import CustomerActions from "@/components/customers/customer-actions";
import { CustomerForm } from "@/components/customers/customer-form";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { currency } from "@/lib/utils";

type CustomerRow = {
    id: string;
    displayName: string;
    identifierType: IdentifierType;
    identifier: string;
    phone?: string;
    totalPurchases: number;
    outstandingBalance: number;
    lastPurchaseDate: string | null;
};

function apiToUiIdentifierType(t: CustomerDto["identifier_type"]): IdentifierType {
    switch (t) {
        case "TIKTOK":
            return "tiktok";
        case "INSTAGRAM":
            return "instagram";
        case "STREET":
            return "street";
        case "APP_USER":
            return "app";
        default:
            return "instagram";
    }
}

export default function CustomersPage() {
    const navigate = useNavigate();
    const addState = useOverlayTriggerState({});
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const { data: customerDtos = [], isLoading, isError } = useQuery({
        queryKey: ["customers"],
        queryFn: listCustomers,
    });

    const customers: CustomerRow[] = customerDtos.map((c) => ({
        id: c.id,
        displayName: c.display_name,
        identifier: c.identifier,
        identifierType: apiToUiIdentifierType(c.identifier_type),
        phone: c.phone ?? undefined,
        totalPurchases: Number(c.lifetime_value ?? 0),
        outstandingBalance: Number(c.balance ?? 0),
        lastPurchaseDate: c.last_sale_date ?? null,
    }));

    const filtered = customers.filter((c) => {
        const matchSearch = c.displayName.toLowerCase().includes(search.toLowerCase()) || c.identifier.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === "all" || c.identifierType === filterType;
        return matchSearch && matchType;
    });

    const totalOutstanding = customers.reduce((a, c) => a + c.outstandingBalance, 0);
    const totalCustomers = customers.length;
    const withBalance = customers.filter((c) => c.outstandingBalance > 0).length;

    const typeIcon = (type: IdentifierType) => {
        const colors: Record<IdentifierType, string> = {
            tiktok: "bg-foreground/10 text-foreground",
            instagram: "bg-primary/10 text-primary",
            street: "bg-warning/20 text-warning",
            app: "bg-success/20 text-success",
        };
        return colors[type];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Customers</h1>
                    <p className="page-subtitle">Manage your customer base and track balances</p>
                </div>
                <SheetDrawer
                    open={addState.isOpen}
                    title="Add New Customer"
                    trigger={
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Customer
                        </Button>
                    }
                    onOpenChange={addState.setOpen}
                >
                    <CustomerForm type="create" onClose={addState.close} />
                </SheetDrawer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="metric-label">Total Customers</p>
                            <p className="metric-value text-xl">{totalCustomers}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="metric-label">With Balance</p>
                            <p className="metric-value text-xl text-destructive">{withBalance}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                            <DollarSign className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="metric-label">Total Outstanding</p>
                            <p className="metric-value text-xl text-destructive">{currency(totalOutstanding)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or handle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {(Object.entries(identifierTypeLabels) as [IdentifierType, string][]).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Identifier</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Total Purchases</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Outstanding</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Last Purchase</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => {
                                    const dto = customerDtos.find((d) => d.id === c.id);
                                    return (
                                        <tr
                                            key={c.id}
                                            className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/customers/${c.id}`)}
                                        >
                                            <td className="p-3 font-medium">{c.displayName}</td>
                                            <td className="p-3 font-mono text-xs">{c.identifier}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={`text-xs ${typeIcon(c.identifierType)}`}>
                                                    {identifierTypeLabels[c.identifierType]}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-medium">{currency(c.totalPurchases)}</td>
                                            <td className="p-3">
                                                {c.outstandingBalance > 0 ? (
                                                    <span className="font-semibold text-destructive">{currency(c.outstandingBalance)}</span>
                                                ) : (
                                                    <span className="text-success font-medium">{currency(0)}</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground text-xs">{c.lastPurchaseDate ?? "—"}</td>
                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                {dto && <CustomerActions customer={dto} />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {filtered.map((c) => {
                    const dto = customerDtos.find((d) => d.id === c.id);
                    return (
                        <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/customers/${c.id}`)}>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <span className="font-medium block truncate">{c.displayName}</span>
                                        <span className="font-mono text-xs text-muted-foreground">{c.identifier}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Badge variant="outline" className={`text-xs ${typeIcon(c.identifierType)}`}>
                                            {identifierTypeLabels[c.identifierType]}
                                        </Badge>
                                        {dto && <CustomerActions customer={dto} />}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <p className="font-heading font-bold">{currency(c.totalPurchases)}</p>
                                    {c.outstandingBalance > 0 && (
                                        <p className="text-xs text-destructive font-semibold">Bal: {currency(c.outstandingBalance)}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
