import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { createPayment, type SaleDto } from "@/lib/api";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { toast } from "sonner";
import { currency } from "@/lib/utils";

interface PaymentFormProps {
    sale: SaleDto;
    displayName: string;
}

export default function PaymentForm({ sale, displayName }: PaymentFormProps) {
    const queryClient = useQueryClient();

    const paymentState = useOverlayTriggerState({});
    const confirmPaymentState = useOverlayTriggerState({});

    const [paymentSaleId, setPaymentSaleId] = useState<number | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

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

    const handleConfirmPayment = () => {
        confirmPaymentState.open();
    };
    const handlePayment = () => {
        createPaymentMutation.mutate();
    };

    return (
        <>
            <SheetDrawer
                open={paymentState.isOpen}
                onOpenChange={paymentState.setOpen}
                title="Record Payment"
                trigger={
                    <Button size="sm" variant="outline" className="text-xs h-7">
                        <CreditCard className="h-3 w-3 mr-1" /> Pay
                    </Button>
                }
            >
                <div className="flex flex-col gap-4 px-4 pb-4">
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sale</span>
                            <span className="font-medium">{sale.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium">{currency(sale.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="font-medium">{currency(sale.total_paid)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-destructive">Balance</span>
                            <span className="text-destructive">{currency(sale.balance)}</span>
                        </div>
                        <div>
                            <Label>Payment Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min={0}
                                max={Number(sale.balance)}
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
            </SheetDrawer>

            {/* Payment confirmation */}
            <ConfirmDrawer
                open={confirmPaymentState.isOpen}
                onOpenChange={confirmPaymentState.setOpen}
                trigger={null}
                title="Confirm Payment"
                description={`Apply payment to sale`}
                content={
                    <div className="space-y-2 text-sm mt-4 px-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer</span>
                            <span className="font-medium">{displayName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-heading font-bold text-success">{currency(Number(paymentAmount) || 0)}</span>
                        </div>
                    </div>
                }
                confirmText="Apply Payment"
                cancelText="Cancel"
                variant="default"
                isLoading={createPaymentMutation.isPending}
                onConfirm={handlePayment}
                onClose={() => confirmPaymentState.close()}
            />
        </>
    );
}
