import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import SheetDrawer from "@/components/ui/sheet-drawer";
import PaymentForm from "./payment-form";
import { SaleDto } from "@/lib/api";
import { SaleStatus } from "@/types/customer";

interface PaymentFormTriggerProps {
    sale: SaleDto;
    status: SaleStatus;
    displayName: string;
}

export default function PaymentFormTrigger({ sale, status, displayName }: PaymentFormTriggerProps) {
    const paymentState = useOverlayTriggerState({});

    return (
        <SheetDrawer
            open={paymentState.isOpen}
            onOpenChange={paymentState.setOpen}
            title="Record Payment"
            trigger={
                <Button size="sm" variant="outline" className="text-xs h-7">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay
                </Button>
            }
        >
            <div className="px-2">
                <PaymentForm sale={sale} displayName={displayName} onClose={paymentState.close} status={status} />
            </div>
        </SheetDrawer>
    );
}
