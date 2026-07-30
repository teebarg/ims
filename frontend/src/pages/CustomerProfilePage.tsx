import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Banknote, CreditCard, Loader2, ShoppingCart, Wallet } from "lucide-react";
import { ChannelLabels, Channels } from "@/types/customer";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getCustomerProfile, createPayment } from "@/lib/api";
import { toast } from "sonner";
import { currency, formatDate } from "@/lib/utils";
import CustomerSalesDetails from "@/components/customers/customers-sales-details";
import SalesForm from "@/components/sales/sales-form";
import { StatCard } from "@/components/StatCard";

const CHANNEL_COLORS = ["hsl(25, 75%, 47%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)"];

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

    const channelData = Channels
        .map((channel) => ({
            name: ChannelLabels[channel],
            value: sales
                .filter((s) => s.channel === channel)
                .reduce((sum, s) => sum + Number(s.total_amount), 0),
        }))
        .filter((d) => d.value > 0);

    const selectedSale = sales.find((s) => s.id === selectedSaleId);
    const saleRefById = useMemo(() => new Map(sales.map((s) => [s.id, s.reference])), [sales]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="page-header">{customer.display_name}</h1>
                    <p className="page-subtitle font-mono">
                        {customer.identifier} · {ChannelLabels[customer.identifier_type]}
                    </p>
                </div>
                <SalesForm
                    initialCustomerId={id}
                    buttonSize="sm"
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard
                    label="Orders"
                    value={sales.length.toString()}
                    icon={ShoppingCart}
                    iconColor="bg-primary/10 text-primary"
                    valueColor="text-primary"
                />
                <StatCard
                    label="Total Orders"
                    value={currency(lifetimeValue)}
                    icon={Banknote}
                    iconColor="bg-blue-50 text-blue-800"
                    valueColor="text-blue-600"
                />
                <StatCard
                    label="Total Spend"
                    value={currency(totalPaid)}
                    icon={Wallet}
                    iconColor="bg-success/10 text-success"
                    valueColor="text-success"
                />
                <StatCard
                    label="Outstanding"
                    value={currency(outstandingBalance)}
                    icon={CreditCard}
                    iconColor="bg-primary/10 text-primary"
                    valueColor={`${outstandingBalance > 0 ? "text-destructive" : "text-success"}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card">
                    <p className="text-sm font-heading mb-1">Sales by Channel</p>
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
                </div>
                <CustomerSalesDetails sales={sales} customer={customer} />
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading">Payment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
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
                                        <td className="p-3 font-mono text-xs">{saleRefById.get(p.sale_id) ?? p.sale_id}</td>
                                        <td className="p-3 text-xs">{formatDate(p.payment_date)}</td>
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
                                <span className="font-medium font-mono">{selectedSale.reference}</span>
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
                                <Label>Payment Amount (₦)</Label>
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
