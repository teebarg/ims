import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowRight, ArrowLeft, Check, CreditCard, ShoppingCart, DollarSign } from "lucide-react";
import { channelLabels } from "@/types/customer";
import {
    listSales,
    listCustomers,
    listBales,
    createSale,
    createPayment,
    type SaleDto,
    type CustomerDto,
    type BaleDto,
    type ApiSalesChannel,
} from "@/lib/api";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { CustomerForm } from "@/components/customers/customer-form";
import { toast } from "sonner";
import { currency } from "@/lib/utils";

function apiToUiChannel(ch: ApiSalesChannel): "shop" | "social" | "website" {
    switch (ch) {
        case "SHOP":
            return "shop";
        case "SOCIAL_MEDIA":
            return "social";
        case "WEBSITE":
            return "website";
        default:
            return "shop";
    }
}

function uiToApiChannel(ch: "shop" | "social" | "website"): ApiSalesChannel {
    switch (ch) {
        case "shop":
            return "SHOP";
        case "social":
            return "SOCIAL_MEDIA";
        case "website":
            return "WEBSITE";
    }
}

function saleStatus(sale: SaleDto): "paid" | "partial" | "unpaid" {
    if (Number(sale.balance) <= 0) return "paid";
    if (Number(sale.total_paid) > 0) return "partial";
    return "unpaid";
}

export default function SalesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const saleState = useOverlayTriggerState({});
    const paymentState = useOverlayTriggerState({});
    const createCustomerState = useOverlayTriggerState({});
    const confirmSaleState = useOverlayTriggerState({});
    const confirmPaymentState = useOverlayTriggerState({});

    const [search, setSearch] = useState("");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const [step, setStep] = useState(1);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedBaleId, setSelectedBaleId] = useState<number | null>(null);
    const [saleQuantity, setSaleQuantity] = useState("");
    const [saleTotal, setSaleTotal] = useState("");
    const [saleChannel, setSaleChannel] = useState<"shop" | "social" | "website">("shop");
    const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
    const [salePaid, setSalePaid] = useState("");

    const [paymentSaleId, setPaymentSaleId] = useState<number | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });
    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
    const { data: bales = [] } = useQuery({ queryKey: ["bales"], queryFn: listBales });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const filtered = sales.filter((s) => {
        const c = customerMap.get(s.customer_id);
        const name = c?.display_name ?? "";
        const ident = c?.identifier ?? "";
        const matchSearch =
            name.toLowerCase().includes(search.toLowerCase()) ||
            ident.toLowerCase().includes(search.toLowerCase()) ||
            String(s.id).includes(search);
        const ch = apiToUiChannel(s.channel);
        const matchChannel = filterChannel === "all" || ch === filterChannel;
        const status = saleStatus(s);
        const matchStatus = filterStatus === "all" || status === filterStatus;
        return matchSearch && matchChannel && matchStatus;
    });

    const filteredCustomers = customers.filter(
        (c) =>
            c.display_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.identifier.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const resetSaleForm = () => {
        setStep(1);
        setSelectedCustomerId(null);
        setSelectedBaleId(null);
        setCustomerSearch("");
        setSaleQuantity("");
        setSaleTotal("");
        setSaleChannel("shop");
        setSaleDate(new Date().toISOString().slice(0, 10));
        setSalePaid("");
    };

    const createSaleMutation = useMutation({
        mutationFn: async () => {
            if (!selectedCustomerId || !selectedBaleId) throw new Error("Select customer and bale");
            const bale = bales.find((b) => b.id === selectedBaleId);
            if (!bale) throw new Error("Bale not found");
            const qty = Number(saleQuantity);
            const total = Number(saleTotal);
            if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(total) || total <= 0) {
                throw new Error("Enter valid quantity and total");
            }
            const unitPrice = total / qty;
            const payload = {
                bale_id: selectedBaleId,
                customer_id: selectedCustomerId,
                category_id: bale.category_id,
                total_quantity: qty,
                unit_price: unitPrice,
                channel: uiToApiChannel(saleChannel),
                sale_date: saleDate || null,
            };
            const sale = await createSale(payload);
            const paid = Number(salePaid) || 0;
            if (paid > 0 && Number(sale.balance) >= paid) {
                await createPayment({ sale_id: sale.id, amount: paid, method: "cash" });
            }
            return sale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            resetSaleForm();
            confirmSaleState.close();
            saleState.close();
            toast.success("Sale recorded");
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to record sale");
        },
    });

    const createPaymentMutation = useMutation({
        mutationFn: async () => {
            if (paymentSaleId == null || !paymentAmount) throw new Error("Select sale and amount");
            const amt = Number(paymentAmount);
            if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter valid amount");
            return createPayment({ sale_id: paymentSaleId, amount: amt, method: "cash" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            confirmPaymentState.close();
            paymentState.close();
            setPaymentSaleId(null);
            setPaymentAmount("");
            toast.success("Payment recorded");
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to record payment");
        },
    });

    const handleConfirmSale = () => {
        confirmSaleState.open();
    };
    const handleSubmitSale = () => {
        createSaleMutation.mutate();
    };
    const handleConfirmPayment = () => {
        confirmPaymentState.open();
    };
    const handlePayment = () => {
        createPaymentMutation.mutate();
    };

    const paymentSale = sales.find((s) => s.id === paymentSaleId);
    const selectedCustomer = selectedCustomerId ? customerMap.get(selectedCustomerId) : null;
    const selectedBale = selectedBaleId ? bales.find((b) => b.id === selectedBaleId) : null;
    const totalNum = Number(saleTotal) || 0;
    const paidNum = Number(salePaid) || 0;
    const balancePreview = totalNum - paidNum;

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
                <Button
                    onClick={() => {
                        resetSaleForm();
                        saleState.open();
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Record Sale
                </Button>
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
                                    const ch = apiToUiChannel(sale.channel);
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
                                            <td className="p-3">{sale.total_quantity}</td>
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
                                                {status !== "paid" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-7"
                                                        onClick={() => {
                                                            setPaymentSaleId(sale.id);
                                                            paymentState.open();
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

            <div className="md:hidden space-y-3">
                {filtered.map((sale) => {
                    const c = customerMap.get(sale.customer_id);
                    const status = saleStatus(sale);
                    const ch = apiToUiChannel(sale.channel);
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
                                {status !== "paid" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs"
                                        onClick={() => {
                                                            setPaymentSaleId(sale.id);
                                                            paymentState.open();
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

            {/* Record Sale - SheetDrawer */}
            <SheetDrawer
                open={saleState.isOpen}
                onOpenChange={saleState.setOpen}
                title="Record New Sale"
                trigger={null}
            >
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pb-4">
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
                        <span className="ml-2 text-xs text-muted-foreground">
                            {step === 1 ? "Customer" : step === 2 ? "Details" : "Payment"}
                        </span>
                    </div>
                    <div className="flex-1 overflow-auto px-4 pb-4 min-h-[220px]">
                        {step === 1 && (
                            <div className="space-y-4">
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
                                            type="button"
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                                selectedCustomerId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                            }`}
                                            onClick={() => setSelectedCustomerId(c.id)}
                                        >
                                            <div>
                                                <span className="font-medium">{c.display_name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">{c.identifier}</span>
                                            </div>
                                            {selectedCustomerId === c.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No customers found.</p>
                                    )}
                                </div>
                                <SheetDrawer
                                    open={createCustomerState.isOpen}
                                    onOpenChange={createCustomerState.setOpen}
                                    title="Create New Customer"
                                    trigger={
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Plus className="h-3 w-3 mr-1" /> Create New Customer
                                        </Button>
                                    }
                                >
                                    <CustomerForm type="create" onClose={createCustomerState.close} />
                                </SheetDrawer>
                                <p className="text-xs text-muted-foreground">
                                    New customers appear in the list after creation. Select them to continue.
                                </p>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                {selectedCustomer && (
                                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
                                        <span className="font-medium">{selectedCustomer.display_name}</span>
                                        <span className="text-muted-foreground font-mono text-xs">{selectedCustomer.identifier}</span>
                                    </div>
                                )}
                                <div>
                                    <Label>Bale</Label>
                                    <Select value={selectedBaleId ? String(selectedBaleId) : ""} onValueChange={(v) => setSelectedBaleId(v ? Number(v) : null)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select bale" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bales.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.reference} · {currency(b.purchase_price)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input type="number" min={1} value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label>Total Amount</Label>
                                        <Input type="number" min={0} step="0.01" value={saleTotal} onChange={(e) => setSaleTotal(e.target.value)} placeholder="0" />
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

                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span className="font-medium">{selectedCustomer?.display_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bale</span>
                                        <span className="font-medium">{selectedBale?.reference}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items</span>
                                        <span>{saleQuantity}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-heading font-bold">{currency(Number(saleTotal))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Channel</span>
                                        <span>{channelLabels[saleChannel]}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Initial Payment (optional)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        max={totalNum}
                                        value={salePaid}
                                        onChange={(e) => setSalePaid(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                {totalNum > 0 && (
                                    <div
                                        className={`p-3 rounded-lg text-sm font-medium flex justify-between ${
                                            balancePreview <= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                        }`}
                                    >
                                        <span>Balance after payment</span>
                                        <span>{currency(Math.max(0, balancePreview))}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between gap-2 px-4 py-4 border-t">
                        <div>
                            {step > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { resetSaleForm(); saleState.close(); }}>
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button
                                    onClick={() => setStep((s) => s + 1)}
                                    disabled={
                                        (step === 1 && !selectedCustomerId) ||
                                        (step === 2 && (!saleQuantity || !saleTotal || !selectedBaleId))
                                    }
                                >
                                    Next <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleConfirmSale} disabled={createSaleMutation.isPending}>
                                    <Check className="h-4 w-4 mr-1" /> Record Sale
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </SheetDrawer>

            {/* Payment - SheetDrawer (no trigger, opened by Pay button) */}
            <SheetDrawer
                open={paymentState.isOpen}
                onOpenChange={paymentState.setOpen}
                title="Record Payment"
                trigger={null}
            >
                {paymentSale && (
                    <div className="flex flex-col gap-4 px-4 pb-4">
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale</span>
                                <span className="font-medium">{paymentSale.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-medium">{currency(paymentSale.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium">{currency(paymentSale.total_paid)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-destructive">Balance</span>
                                <span className="text-destructive">{currency(paymentSale.balance)}</span>
                            </div>
                            <div>
                                <Label>Payment Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={Number(paymentSale.balance)}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end border-t pt-4">
                            <Button variant="outline" onClick={() => paymentState.close()}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmPayment} disabled={createPaymentMutation.isPending || !paymentAmount}>
                                Apply Payment
                            </Button>
                        </div>
                    </div>
                )}
            </SheetDrawer>

            {/* Sale confirmation */}
            <ConfirmDrawer
                open={confirmSaleState.isOpen}
                onOpenChange={confirmSaleState.setOpen}
                trigger={null}
                title="Confirm Sale"
                description="Please review and confirm the sale details."
                content={
                    <div className="space-y-2 text-sm mt-4 px-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer</span>
                            <span className="font-medium">{selectedCustomer?.display_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bale</span>
                            <span className="font-medium">{selectedBale?.reference}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity</span>
                            <span>{saleQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-heading font-bold">{currency(Number(saleTotal))}</span>
                        </div>
                        {paidNum > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Initial payment</span>
                                <span className="text-success">{currency(paidNum)}</span>
                            </div>
                        )}
                    </div>
                }
                confirmText="Confirm & Create Sale"
                cancelText="Cancel"
                variant="default"
                isLoading={createSaleMutation.isPending}
                onConfirm={handleSubmitSale}
                onClose={() => confirmSaleState.close()}
            />

            {/* Payment confirmation */}
            <ConfirmDrawer
                open={confirmPaymentState.isOpen}
                onOpenChange={confirmPaymentState.setOpen}
                trigger={null}
                title="Confirm Payment"
                description={`Apply payment to sale`}
                content={
                    paymentSale && (
                        <div className="space-y-2 text-sm mt-4 px-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="font-medium">{customerMap.get(paymentSale.customer_id)?.display_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-heading font-bold text-success">{currency(Number(paymentAmount) || 0)}</span>
                            </div>
                        </div>
                    )
                }
                confirmText="Apply Payment"
                cancelText="Cancel"
                variant="default"
                isLoading={createPaymentMutation.isPending}
                onConfirm={handlePayment}
                onClose={() => confirmPaymentState.close()}
            />
        </div>
    );
}
