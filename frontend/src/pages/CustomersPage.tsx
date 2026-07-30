import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, AlertCircle, Banknote } from "lucide-react";
import { ChannelLabels, Channels, ChannelType } from "@/types/customer";
import { listCustomers } from "@/lib/api";
import CustomerActions from "@/components/customers/customer-actions";
import SalesForm from "@/components/sales/sales-form";
import { CustomerForm } from "@/components/customers/customer-form";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { currency } from "@/lib/utils";
import { StatCard } from "@/components/StatCard";

type CustomerRow = {
    id: string;
    displayName: string;
    identifierType: ChannelType;
    identifier: string;
    phone?: string;
    totalPurchases: number;
    outstandingBalance: number;
    lastPurchaseDate: string | null;
};

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
        identifierType: c.identifier_type,
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

    const typeIcon = (type: ChannelType) => {
        const colors: Record<ChannelType, string> = {
            TIKTOK: "bg-foreground/10 text-foreground",
            FACEBOOK: "bg-indigo-800 text-indigo-100",
            INSTAGRAM: "bg-primary/10 text-primary",
            SHOP: "bg-warning/20 text-warning",
            WEBSITE: "bg-success/20 text-success",
        };
        return colors[type];
    };

    return (
        <div className="space-y-6">
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
                            <Plus className="h-4 w-4" /> Add Customer
                        </Button>
                    }
                    onOpenChange={addState.setOpen}
                >
                    <CustomerForm type="create" onClose={addState.close} />
                </SheetDrawer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <StatCard
                    label="Total Customers"
                    value={totalCustomers.toString()}
                    icon={Users}
                    iconColor="bg-primary/10 text-primary"
                    valueColor="text-primary"
                />
                <StatCard
                    label="With Balance"
                    value={withBalance.toString()}
                    icon={AlertCircle}
                    iconColor="bg-success/10 text-success"
                    valueColor="text-success"
                />
                <StatCard
                    label="Total Outstanding"
                    value={currency(totalOutstanding)}
                    icon={Banknote}
                    iconColor="bg-destructive/10 text-destructive"
                    valueColor="text-destructive"
                />
            </div>

            <div className="flex gap-2">
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
                        {Channels.map((type) => (
                            <SelectItem key={type} value={type}>
                                {ChannelLabels[type]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="hidden md:block">
                <table className="w-full text-sm bg-card rounded-md overflow-hidden">
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
                                            {ChannelLabels[c.identifierType]}
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
            </div>

            <div className="md:hidden space-y-2">
                {filtered.map((c) => {
                    const dto = customerDtos.find((d) => d.id === c.id);
                    return (
                        <div key={c.id} className="cursor-pointer hover:shadow-md transition-shadow bg-card p-2.5 rounded-md overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1 flex items-center gap-1" onClick={() => navigate(`/customers/${c.id}`)}>
                                    <span className="font-medium block truncate">{c.displayName}</span>
                                    <span className="font-mono text-xs text-muted-foreground">({c.identifier})</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Badge variant="outline" className={`text-xs ${typeIcon(c.identifierType)}`}>
                                        {ChannelLabels[c.identifierType]}
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
                            <hr className="my-2" />
                            <div className="flex items-center justify-end text-sm">
                                <SalesForm buttonSize="sm" initialCustomerId={c.id} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
