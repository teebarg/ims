import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPayment, type SaleDto } from "@/lib/api";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { toast } from "sonner";
import { currency } from "@/lib/utils";
import { SaleStatus } from "@/types/customer";

interface PaymentFormProps {
    sale: SaleDto;
    status: SaleStatus;
    displayName: string;
    onClose?: () => void;
}

export default function PaymentForm({ sale, status, displayName, onClose }: PaymentFormProps) {
    const queryClient = useQueryClient();
    const confirmPaymentState = useOverlayTriggerState({});

    const balance = Number(sale.balance);

    const [paymentAmount, setPaymentAmount] = useState(String(balance));

    const validatePayment = () => {
        const amt = Number(paymentAmount);

        if (!Number.isFinite(amt) || amt <= 0) {
            toast.error("Enter a valid payment amount");
            return false;
        }

        if (amt > balance) {
            toast.error(`Payment cannot exceed balance (${currency(balance)})`);
            return false;
        }

        return true;
    };

    const createPaymentMutation = useMutation({
        mutationFn: async () => {
            const amt = Number(paymentAmount);

            if (!validatePayment()) throw new Error("Invalid payment");

            return createPayment({
                sale_id: sale.id,
                amount: amt,
                method: "cash",
            });
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });

            confirmPaymentState.close();
            setPaymentAmount(String(balance));

            toast.success("Payment recorded");
        },

        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to record payment");
        },
    });

    const handleConfirmPayment = () => {
        if (!validatePayment()) return;
        confirmPaymentState.open();
    };

    const handlePayment = () => {
        createPaymentMutation.mutate();
    };

    const remainingAfterPayment = balance - (Number(paymentAmount) || 0);

    if (status === "paid") {
        return null;
    }

    return (
        <>
            <div className="flex flex-col gap-5 pb-4">
                {/* Sale summary */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Sale</span>
                        <span className="font-medium font-mono">{sale.reference}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span>{currency(sale.total_amount)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span>{currency(sale.total_paid)}</span>
                    </div>

                    <div className="flex justify-between font-semibold text-destructive">
                        <span>Balance</span>
                        <span>{currency(balance)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Quick Amount</Label>

                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="secondary" onClick={() => setPaymentAmount(String(balance))}>
                            Full
                        </Button>

                        <Button variant="secondary" onClick={() => setPaymentAmount(String((balance / 2).toFixed(2)))}>
                            Half
                        </Button>

                        <Button variant="secondary" onClick={() => setPaymentAmount("")}>
                            Custom
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Payment Amount</Label>

                    <Input type="number" step="0.01" min={0} max={balance} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />

                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Balance</span>
                        <span>{currency(balance)}</span>
                    </div>

                    {Number(paymentAmount) > 0 && (
                        <div className="text-xs flex justify-between font-medium">
                            <span>Remaining after payment</span>

                            <span className={remainingAfterPayment <= 0 ? "text-success" : "text-muted-foreground"}>
                                {currency(Math.max(remainingAfterPayment, 0))}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 justify-end border-t pt-4">
                    <Button variant="outline" onClick={() => onClose?.()}>
                        Cancel
                    </Button>

                    <Button onClick={handleConfirmPayment} disabled={createPaymentMutation.isPending || !paymentAmount || Number(paymentAmount) <= 0}>
                        Apply Payment
                    </Button>
                </div>
            </div>

            <ConfirmDrawer
                open={confirmPaymentState.isOpen}
                onOpenChange={confirmPaymentState.setOpen}
                trigger={null}
                title="Confirm Payment"
                description="Apply payment to sale"
                content={
                    <div className="space-y-2 text-sm mt-4 px-4 pb-4">
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
