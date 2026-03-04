import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { identifierTypeLabels, channelLabels } from "@/types/customer";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CHANNEL_COLORS = ["hsl(25, 75%, 47%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)"];

export default function CustomerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { customers, sales, payments, addPayment } = useStore();
    const customer = customers.find(c => c.id === id);

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    if (!customer) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-muted-foreground">Customer not found.</p>
            <Button variant="outline" onClick={() => navigate("/customers")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        </div>
    );

    const customerSales = sales.filter(s => s.customerId === customer.id);
    const customerPayments = payments.filter(p => customerSales.some(s => s.id === p.saleId));
    const totalPaid = customerSales.reduce((a, s) => a + s.paid, 0);

    // Channel breakdown
    const channelData = ["shop", "social", "website"].map(ch => ({
        name: channelLabels[ch],
        value: customerSales.filter(s => s.channel === ch).reduce((a, s) => a + s.total, 0),
    })).filter(d => d.value > 0);

    const selectedSale = customerSales.find(s => s.id === selectedSaleId);

    const handlePay = () => {
        if (!selectedSaleId || !paymentAmount) return;
        addPayment(selectedSaleId, Number(paymentAmount));
        setPaymentOpen(false);
        setPaymentAmount("");
        setSelectedSaleId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="page-header">{customer.displayName}</h1>
                    <p className="page-subtitle font-mono">{customer.identifier} · {identifierTypeLabels[customer.identifierType]}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <ShoppingCart className="h-5 w-5 text-primary mb-1" />
                        <p className="metric-value text-lg">{customerSales.length}</p>
                        <p className="metric-label text-xs">Sales</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <DollarSign className="h-5 w-5 text-primary mb-1" />
                        <p className="metric-value text-lg">${customer.totalPurchases}</p>
                        <p className="metric-label text-xs">Lifetime</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <TrendingUp className="h-5 w-5 text-success mb-1" />
                        <p className="metric-value text-lg text-success">${totalPaid}</p>
                        <p className="metric-label text-xs">Total Paid</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <CreditCard className="h-5 w-5 text-destructive mb-1" />
                        <p className={`metric-value text-lg ${customer.outstandingBalance > 0 ? "text-destructive" : "text-success"}`}>
                            ${customer.outstandingBalance}
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
                                    <Pie data={channelData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {channelData.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
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
                                {customerSales.map(s => (
                                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-mono text-xs">{s.id}</td>
                                        <td className="p-3 text-xs">{s.date}</td>
                                        <td className="p-3 text-xs">{channelLabels[s.channel]}</td>
                                        <td className="p-3 font-medium">${s.total}</td>
                                        <td className="p-3">${s.paid}</td>
                                        <td className="p-3">
                                            <Badge variant={s.status === "paid" ? "default" : s.status === "partial" ? "secondary" : "destructive"} className="text-xs font-normal">
                                                {s.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            {s.status !== "paid" && (
                                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setSelectedSaleId(s.id); setPaymentOpen(true); }}>
                                                    <CreditCard className="h-3 w-3 mr-1" /> Pay
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
                            {customerPayments.length === 0 ? (
                                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No payments yet.</td></tr>
                            ) : customerPayments.map(p => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-mono text-xs">{p.id}</td>
                                    <td className="p-3 font-mono text-xs">{p.saleId}</td>
                                    <td className="p-3 text-xs">{p.date}</td>
                                    <td className="p-3 font-medium text-success">${p.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Update Payment</DialogTitle>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale</span>
                                <span className="font-medium">{selectedSale.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-medium">${selectedSale.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium">${selectedSale.paid}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-destructive">Balance</span>
                                <span className="text-destructive">${selectedSale.total - selectedSale.paid}</span>
                            </div>
                            <div>
                                <Label>Payment Amount ($)</Label>
                                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedSale.total - selectedSale.paid} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                        <Button onClick={handlePay}>Apply Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
