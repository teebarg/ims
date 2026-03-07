import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerPayments, type PaymentDto } from "@/lib/api";
import { currency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Receipt } from "lucide-react";
import { useOverlayTriggerState } from "react-stately";
import SheetDrawer from "@/components/ui/sheet-drawer";

interface SalePaymentsDetailsProps {
    saleId: number;
    customerId: string;
    saleTotal: number;
}

export default function SalePaymentsDetails({ saleId, customerId, saleTotal }: SalePaymentsDetailsProps) {
    const state = useOverlayTriggerState({});

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ["customer-payments", customerId],
        queryFn: () => getCustomerPayments(customerId),
        enabled: state.isOpen,
    });

    const salePayments: PaymentDto[] = useMemo(
        () => payments.filter((p) => p.sale_id === saleId).sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
        [payments, saleId]
    );

    const totalPaid = salePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const balance = saleTotal - totalPaid;

    return (
        <SheetDrawer
            open={state.isOpen}
            onOpenChange={state.setOpen}
            title={
                <span className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Payment history
                </span>
            }
            trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-sm gap-1">
                    <CreditCard className="h-3 w-3" />
                    Payments
                </Button>
            }
        >
            <div className="flex flex-col h-full px-4 pb-4 space-y-4">
                <div className="text-sm space-y-1 border rounded-md p-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Sale total</span>
                        <span>{currency(saleTotal)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span>{currency(totalPaid)}</span>
                    </div>

                    <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Balance</span>
                        <span className={balance > 0 ? "text-destructive" : ""}>{currency(balance)}</span>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading payments...
                    </div>
                )}

                {!isLoading && salePayments.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No payments recorded.</p>}

                {!isLoading && salePayments.length > 0 && (
                    <div className="space-y-2 overflow-auto">
                        {salePayments.map((p) => (
                            <div key={p.id} className="border rounded-md px-3 py-2 text-sm flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{currency(p.amount)}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                            {p.method}
                                        </Badge>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground">{formatDate(p.payment_date)}</p>

                                    {p.reference && <p className="text-[10px] text-muted-foreground">Ref: {p.reference}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SheetDrawer>
    );
}
