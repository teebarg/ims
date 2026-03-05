import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, ArrowRight, ArrowLeft, Check, CreditCard, ShoppingCart, DollarSign } from "lucide-react";
import { identifierTypeLabels, channelLabels, type IdentifierType, type Customer } from "@/types/customer";

export default function SalesPage() {
    const { customers, sales, addCustomer, addSale, addPayment, getCustomer } = useStore();
    const navigate = useNavigate();

    // Filters
    const [search, setSearch] = useState("");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // New sale stepper
    const [saleOpen, setSaleOpen] = useState(false);
    const [step, setStep] = useState(1);

    // Step 1: Customer
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [newCustForm, setNewCustForm] = useState({ displayName: "", identifierType: "instagram" as IdentifierType, identifier: "", phone: "" });

    // Step 2: Details
    const [saleItems, setSaleItems] = useState("");
    const [saleTotal, setSaleTotal] = useState("");
    const [saleChannel, setSaleChannel] = useState<"shop" | "social" | "website">("shop");
    const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

    // Step 3: Payment
    const [salePaid, setSalePaid] = useState("");

    // Payment dialog
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentSaleId, setPaymentSaleId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    const filtered = sales.filter((s) => {
        const c = getCustomer(s.customerId);
        const name = c?.displayName ?? "";
        const ident = c?.identifier ?? "";
        const matchSearch =
            name.toLowerCase().includes(search.toLowerCase()) ||
            ident.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase());
        const matchChannel = filterChannel === "all" || s.channel === filterChannel;
        const matchStatus = filterStatus === "all" || s.status === filterStatus;
        return matchSearch && matchChannel && matchStatus;
    });

    const filteredCustomers = customers.filter(
        (c) => c.displayName.toLowerCase().includes(customerSearch.toLowerCase()) || c.identifier.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const resetSaleForm = () => {
        setStep(1);
        setSelectedCustomerId(null);
        setCustomerSearch("");
        setCreatingCustomer(false);
        setNewCustForm({ displayName: "", identifierType: "instagram", identifier: "", phone: "" });
        setSaleItems("");
        setSaleTotal("");
        setSaleChannel("shop");
        setSaleDate(new Date().toISOString().slice(0, 10));
        setSalePaid("");
    };

    const handleCreateInlineCustomer = () => {
        if (!newCustForm.displayName.trim() || !newCustForm.identifier.trim()) return;
        const c = addCustomer({
            displayName: newCustForm.displayName.trim(),
            identifierType: newCustForm.identifierType,
            identifier: newCustForm.identifier.trim(),
            phone: newCustForm.phone.trim() || undefined,
        });
        setSelectedCustomerId(c.id);
        setCreatingCustomer(false);
    };

    const handleSubmitSale = () => {
        if (!selectedCustomerId) return;
        addSale({
            date: saleDate,
            customerId: selectedCustomerId,
            items: Number(saleItems),
            total: Number(saleTotal),
            paid: Number(salePaid) || 0,
            channel: saleChannel,
        });
        resetSaleForm();
        setSaleOpen(false);
    };

    const handlePayment = () => {
        if (!paymentSaleId || !paymentAmount) return;
        addPayment(paymentSaleId, Number(paymentAmount));
        setPaymentOpen(false);
        setPaymentAmount("");
        setPaymentSaleId(null);
    };

    const paymentSale = sales.find((s) => s.id === paymentSaleId);
    const selectedCustomer = selectedCustomerId ? getCustomer(selectedCustomerId) : null;
    const balancePreview = Number(saleTotal) - (Number(salePaid) || 0);

    // Summary stats
    const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
    const totalCollected = sales.reduce((a, s) => a + s.paid, 0);
    const totalOutstanding = totalRevenue - totalCollected;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Sales & Payments</h1>
                    <p className="page-subtitle">Record sales and manage payments</p>
                </div>
                <Button
                    onClick={() => {
                        resetSaleForm();
                        setSaleOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Record Sale
                </Button>
            </div>

            {/* Quick Stats */}
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
                            <p className="metric-value text-xl text-success">${totalCollected}</p>
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
                            <p className="metric-value text-xl text-destructive">${totalOutstanding}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
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
                        <SelectItem value="social">Social Media</SelectItem>
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

            {/* Desktop Table */}
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
                                    const c = getCustomer(sale.customerId);
                                    return (
                                        <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-mono text-xs">{sale.id}</td>
                                            <td className="p-3 text-xs">{sale.date}</td>
                                            <td className="p-3">
                                                <button
                                                    className="text-left hover:underline"
                                                    onClick={() => navigate(`/customers/${sale.customerId}`)}
                                                >
                                                    <span className="font-medium">{c?.displayName}</span>
                                                    <span className="block text-xs text-muted-foreground font-mono">{c?.identifier}</span>
                                                </button>
                                            </td>
                                            <td className="p-3 text-xs">{channelLabels[sale.channel]}</td>
                                            <td className="p-3">{sale.items}</td>
                                            <td className="p-3 font-medium">${sale.total}</td>
                                            <td className="p-3">${sale.paid}</td>
                                            <td className="p-3">
                                                <Badge
                                                    variant={
                                                        sale.status === "paid" ? "default" : sale.status === "partial" ? "secondary" : "destructive"
                                                    }
                                                    className="text-xs font-normal"
                                                >
                                                    {sale.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                {sale.status !== "paid" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7"
                                                        onClick={() => {
                                                            setPaymentSaleId(sale.id);
                                                            setPaymentOpen(true);
                                                        }}
                                                    >
                                                        <CreditCard className="h-3 w-3 mr-1" /> Pay
                                                    </Button>
                                                )}
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
                {filtered.map((sale) => {
                    const c = getCustomer(sale.customerId);
                    return (
                        <Card key={sale.id}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-medium">{sale.id}</span>
                                        <Badge
                                            variant={sale.status === "paid" ? "default" : sale.status === "partial" ? "secondary" : "destructive"}
                                            className="text-xs"
                                        >
                                            {sale.status}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{sale.date}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{c?.displayName}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {c?.identifier} · {channelLabels[sale.channel]}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-heading font-bold">${sale.total}</p>
                                        {sale.status !== "paid" && <p className="text-xs text-destructive">Bal: ${sale.total - sale.paid}</p>}
                                    </div>
                                </div>
                                {sale.status !== "paid" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs"
                                        onClick={() => {
                                            setPaymentSaleId(sale.id);
                                            setPaymentOpen(true);
                                        }}
                                    >
                                        <CreditCard className="h-3 w-3 mr-1" /> Update Payment
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* New Sale Dialog – Stepper */}
            <Dialog
                open={saleOpen}
                onOpenChange={(open) => {
                    if (!open) resetSaleForm();
                    setSaleOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Record New Sale</DialogTitle>
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 pt-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                                            step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                                    </div>
                                    {s < 3 && <div className={`h-0.5 w-8 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
                                </div>
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">{step === 1 ? "Customer" : step === 2 ? "Details" : "Payment"}</span>
                        </div>
                    </DialogHeader>

                    <div className="py-4 min-h-[220px]">
                        {/* Step 1: Customer */}
                        {step === 1 && (
                            <div className="space-y-4">
                                {!creatingCustomer ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search customers..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-1">
                                            {filteredCustomers.map((c) => (
                                                <button
                                                    key={c.id}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                                        selectedCustomerId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                    }`}
                                                    onClick={() => setSelectedCustomerId(c.id)}
                                                >
                                                    <div>
                                                        <span className="font-medium">{c.displayName}</span>
                                                        <span className="ml-2 text-xs text-muted-foreground font-mono">{c.identifier}</span>
                                                    </div>
                                                    {selectedCustomerId === c.id && <Check className="h-4 w-4" />}
                                                </button>
                                            ))}
                                            {filteredCustomers.length === 0 && (
                                                <p className="text-xs text-muted-foreground text-center py-4">No customers found.</p>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => setCreatingCustomer(true)}>
                                            <Plus className="h-3 w-3 mr-1" /> Create New Customer
                                        </Button>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Display Name</Label>
                                            <Input
                                                value={newCustForm.displayName}
                                                onChange={(e) => setNewCustForm((p) => ({ ...p, displayName: e.target.value }))}
                                                placeholder="e.g. Bella W."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Type</Label>
                                                <Select
                                                    value={newCustForm.identifierType}
                                                    onValueChange={(v: IdentifierType) => setNewCustForm((p) => ({ ...p, identifierType: v }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(Object.entries(identifierTypeLabels) as [IdentifierType, string][]).map(([k, v]) => (
                                                            <SelectItem key={k} value={k}>
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Identifier</Label>
                                                <Input
                                                    value={newCustForm.identifier}
                                                    onChange={(e) => setNewCustForm((p) => ({ ...p, identifier: e.target.value }))}
                                                    placeholder="@handle"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setCreatingCustomer(false)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleCreateInlineCustomer}>
                                                Create & Select
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {step === 2 && (
                            <div className="space-y-4">
                                {selectedCustomer && (
                                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
                                        <span className="font-medium">{selectedCustomer.displayName}</span>
                                        <span className="text-muted-foreground font-mono text-xs">{selectedCustomer.identifier}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input type="number" value={saleItems} onChange={(e) => setSaleItems(e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label>Total Amount ($)</Label>
                                        <Input type="number" value={saleTotal} onChange={(e) => setSaleTotal(e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Channel</Label>
                                        <Select value={saleChannel} onValueChange={(v: "shop" | "social" | "website") => setSaleChannel(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="shop">Shop</SelectItem>
                                                <SelectItem value="social">Social Media</SelectItem>
                                                <SelectItem value="website">Website</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Date</Label>
                                        <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span className="font-medium">{selectedCustomer?.displayName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items</span>
                                        <span>{saleItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-heading font-bold">${saleTotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Channel</span>
                                        <span>{channelLabels[saleChannel]}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Payment Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={salePaid}
                                        onChange={(e) => setSalePaid(e.target.value)}
                                        placeholder="0"
                                        max={Number(saleTotal)}
                                    />
                                </div>
                                {Number(saleTotal) > 0 && (
                                    <div
                                        className={`p-3 rounded-lg text-sm font-medium flex justify-between ${
                                            balancePreview <= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                        }`}
                                    >
                                        <span>Balance after payment</span>
                                        <span>${Math.max(0, balancePreview)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-row justify-between sm:justify-between">
                        <div>
                            {step > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    resetSaleForm();
                                    setSaleOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button
                                    onClick={() => setStep((s) => s + 1)}
                                    disabled={(step === 1 && !selectedCustomerId) || (step === 2 && (!saleItems || !saleTotal))}
                                >
                                    Next <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmitSale}>
                                    <Check className="h-4 w-4 mr-1" /> Record Sale
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Update Payment</DialogTitle>
                    </DialogHeader>
                    {paymentSale && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale</span>
                                <span className="font-medium">{paymentSale.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-medium">${paymentSale.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium">${paymentSale.paid}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-destructive">Balance</span>
                                <span className="text-destructive">${paymentSale.total - paymentSale.paid}</span>
                            </div>
                            <div>
                                <Label>Payment Amount ($)</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={paymentSale.total - paymentSale.paid}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePayment}>Apply Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
