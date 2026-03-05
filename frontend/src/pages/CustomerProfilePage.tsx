import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, DollarSign, Loader2, ShoppingCart, TrendingUp } from "lucide-react";
import { identifierTypeLabels, channelLabels } from "@/types/customer";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
    getCustomerProfile,
    createPayment,
    type ApiIdentifierType,
    type ApiSalesChannel,
} from "@/lib/api";
import { toast } from "sonner";
import { currency } from "@/lib/utils";

const CHANNEL_COLORS = ["hsl(25, 75%, 47%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)"];

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

function apiToUiIdentifierType(t: ApiIdentifierType): "tiktok" | "instagram" | "street" | "app" {
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

export default function CustomerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    const {
        data: profile,
        isLoading: profileLoading,
        isError: profileError,
    } = useQuery({
        queryKey: ["customer", id, "profile"],
        queryFn: () => getCustomerProfile(id!),
        enabled: !!id,
    });

    const customer = profile?.customer;
    const sales = profile?.sales ?? [];
    const payments = profile?.payments ?? [];
    const outstandingBalance = profile?.balance ?? 0;
    const lifetimeValue = profile?.lifetime_value ?? 0;

    const createPaymentMutation = useMutation({
        mutationFn: (payload: { sale_id: number; amount: number; method: string; reference?: string | null }) => createPayment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer", id, "profile"] });
            setPaymentOpen(false);
            setPaymentAmount("");
            setSelectedSaleId(null);
            toast.success("Payment recorded");
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to record payment");
        },
    });

    const totalPaid = lifetimeValue - outstandingBalance;

    const channelData = ["shop", "social", "website"]
        .map((ch) => ({
            name: channelLabels[ch],
            value: sales.filter((s) => apiToUiChannel(s.channel) === ch).reduce((a, s) => a + Number(s.total_amount), 0),
        }))
        .filter((d) => d.value > 0);

    const selectedSale = sales.find((s) => s.id === selectedSaleId);

    const handlePay = () => {
        if (selectedSaleId == null || !paymentAmount) return;
        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) return;
        const remaining = selectedSale ? Number(selectedSale.balance) : 0;
        if (amount > remaining) {
            toast.error("Amount exceeds remaining balance");
            return;
        }
        createPaymentMutation.mutate({
            sale_id: selectedSaleId,
            amount,
            method: "cash",
        });
    };

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">Invalid customer.</p>
                <Button variant="outline" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </div>
        );
    }

    if (profileLoading || (!profile && !profileError)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading customer...</p>
            </div>
        );
    }

    if (profileError || !customer) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">Customer not found.</p>
                <Button variant="outline" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </div>
        );
    }

    const identifierType = apiToUiIdentifierType(customer.identifier_type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="page-header">{customer.display_name}</h1>
                    <p className="page-subtitle font-mono">
                        {customer.identifier} · {identifierTypeLabels[identifierType]}
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <ShoppingCart className="h-5 w-5 text-primary mb-1" />
                        <p className="metric-value text-lg">{sales.length}</p>
                        <p className="metric-label text-xs">Sales</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <DollarSign className="h-5 w-5 text-primary mb-1" />
                        <p className="metric-value text-lg">{currency(lifetimeValue)}</p>
                        <p className="metric-label text-xs">Lifetime</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <TrendingUp className="h-5 w-5 text-success mb-1" />
                        <p className="metric-value text-lg text-success">{currency(totalPaid)}</p>
                        <p className="metric-label text-xs">Total Paid</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <CreditCard className="h-5 w-5 text-destructive mb-1" />
                        <p className={`metric-value text-lg ${outstandingBalance > 0 ? "text-destructive" : "text-success"}`}>
                            {currency(outstandingBalance)}
                        </p>
                        <p className="metric-label text-xs">Outstanding</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales by Channel */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-heading">Sales by Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {channelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={channelData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {channelData.map((_, i) => (
                                            <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No sales yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Sales History */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-heading">Sales History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Paid</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((s) => {
                                    const status = Number(s.balance) <= 0 ? "paid" : Number(s.total_paid) > 0 ? "partial" : "unpaid";
                                    const channelUi = apiToUiChannel(s.channel);
                                    return (
                                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-mono text-xs">{s.id}</td>
                                            <td className="p-3 text-xs">{s.sale_date}</td>
                                            <td className="p-3 text-xs">{channelLabels[channelUi]}</td>
                                            <td className="p-3 font-medium">{currency(s.total_amount)}</td>
                                            <td className="p-3">{currency(s.total_paid)}</td>
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
                                                            setSelectedSaleId(s.id);
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

            {/* Payment History */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading">Payment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3 font-medium text-muted-foreground">Payment ID</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Sale</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                        No payments yet.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-mono text-xs">{p.id}</td>
                                        <td className="p-3 font-mono text-xs">{p.sale_id}</td>
                                        <td className="p-3 text-xs">{p.payment_date.slice(0, 10)}</td>
                                        <td className="p-3 font-medium text-success">{currency(p.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Record Payment</DialogTitle>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale</span>
                                <span className="font-medium">{selectedSale.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-medium">{currency(selectedSale.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium">{currency(selectedSale.total_paid)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-destructive">Balance</span>
                                <span className="text-destructive">{currency(selectedSale.balance)}</span>
                            </div>
                            <div>
                                <Label>Payment Amount ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={Number(selectedSale.balance)}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePay} disabled={createPaymentMutation.isPending || !paymentAmount}>
                            {createPaymentMutation.isPending ? "Saving..." : "Apply Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
