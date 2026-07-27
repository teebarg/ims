import { useOverlayTriggerState } from "react-stately";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Pencil, Trash2, Truck } from "lucide-react";
import { deleteSale, type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import DeliveryForm from "./delivery-form";
import PaymentFormTrigger from "./payment-form-trigger";
import SalesEditForm from "./sales-edit-form";
import { apiToDeliveryStatus, type DeliveryStatus, SaleStatus } from "@/types/customer";

interface SalesActionsProps {
    sale: SaleDto;
    displayName: string;
    status: SaleStatus;
}

export default function SalesActions({ sale, displayName, status }: SalesActionsProps) {
    const deliveryState = useOverlayTriggerState({});
    const deliveredState = useOverlayTriggerState({});
    const editState = useOverlayTriggerState({});
    const deleteState = useOverlayTriggerState({});
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

    const deleteMutation = useMutation({
        mutationFn: () => deleteSale(sale.id),
        onSuccess: () => {
            toast.success("Sale deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            deleteState.close();
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to delete sale");
        },
    });

    const onConfirmDelete = async () => {
        await deleteMutation.mutateAsync();
    };

    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <SheetDrawer
                open={editState.isOpen}
                onOpenChange={editState.setOpen}
                title="Edit Sale Items"
                trigger={
                    <Button size="sm" variant="outline" className="text-xs h-7">
                        <Pencil className="h-3 w-3" />
                    </Button>
                }
            >
                <SalesEditForm sale={sale} displayName={displayName} onClose={editState.close} />
            </SheetDrawer>
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
            <ConfirmDrawer
                open={deleteState.isOpen}
                onOpenChange={deleteState.setOpen}
                trigger={
                    <Button size="sm" variant="outline" className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                }
                title={`Delete ${sale.reference}`}
                description="This action cannot be undone. This will permanently delete the sale and restore inventory."
                confirmText="Delete Sale"
                isLoading={deleteMutation.isPending}
                onConfirm={onConfirmDelete}
                onClose={deleteState.close}
            />
        </div>
    );
}
