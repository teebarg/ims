import { useOverlayTriggerState } from "react-stately";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck } from "lucide-react";
import { type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import DeliveryForm from "./delivery-form";
import PaymentFormTrigger from "./payment-form-trigger";
import { apiToDeliveryStatus, type DeliveryStatus, SaleStatus } from "@/types/customer";

interface SalesActionsProps {
    sale: SaleDto;
    displayName: string;
    status: SaleStatus;
}

export default function SalesActions({ sale, displayName, status }: SalesActionsProps) {
    const deliveryState = useOverlayTriggerState({});
    const deliveredState = useOverlayTriggerState({});
    const queryClient = useQueryClient();

    const deliveryStatus: DeliveryStatus = apiToDeliveryStatus(sale.delivery_status);

    const deliveryMutation = useMutation({
        mutationFn: () =>
            updateSaleDeliveryApi(sale.id, {
                delivery_status: "DELIVERED",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            deliveredState.close();
        },
    });

    return (
        <div className="flex items-center gap-2">
            {status !== "paid" && <PaymentFormTrigger sale={sale} displayName={displayName} status={status} />}
            {deliveryStatus === "processing" && (
                <SheetDrawer
                    open={deliveryState.isOpen}
                    onOpenChange={deliveryState.setOpen}
                    title="Record Payment"
                    trigger={
                        <Button size="sm" variant="outline" className="text-xs h-7">
                            <Truck className="h-3 w-3" />
                        </Button>
                    }
                >
                    <DeliveryForm sale={sale} displayName={displayName} onClose={deliveryState.close} status={status} />
                </SheetDrawer>
            )}
            {deliveryStatus === "out_for_delivery" && (
                <ConfirmDrawer
                    open={deliveredState.isOpen}
                    onOpenChange={deliveredState.setOpen}
                    trigger={
                        <Button size="sm" variant="outline" className="text-xs h-7 border-success/30 text-success hover:bg-success/10">
                            <CheckCircle2 className="h-3 w-3" />
                        </Button>
                    }
                    title="Confirm Delivery"
                    description="Mark this sale as delivered?"
                    confirmText="Mark Delivered"
                    cancelText="Cancel"
                    variant="default"
                    isLoading={deliveryMutation.isPending}
                    onConfirm={() => deliveryMutation.mutate()}
                    onClose={() => deliveredState.close()}
                />
            )}
        </div>
    );
}
