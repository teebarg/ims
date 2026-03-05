import type React from "react";
import { useOverlayTriggerState } from "react-stately";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCustomer, type CustomerDto } from "@/lib/api";
import SheetDrawer from "../ui/sheet-drawer";
import { CustomerForm } from "./customer-form";
import { ConfirmDrawer } from "../ui/confirm-drawer";

interface Props {
    customer: CustomerDto;
}

const CustomerActions: React.FC<Props> = ({ customer }) => {
    const queryClient = useQueryClient();
    const deleteState = useOverlayTriggerState({});
    const editState = useOverlayTriggerState({});

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => deleteCustomer(id),
        onSuccess: () => {
            toast.success("Customer deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to delete customer");
        },
    });

    const onConfirmDelete = async () => {
        if (!customer) return;
        await deleteMutation.mutateAsync(customer.id);
        deleteState.close();
    };

    return (
        <div className="flex items-center flex-wrap" onClick={(e) => e.stopPropagation()}>
            <SheetDrawer
                open={editState.isOpen}
                title={`Edit Customer ${customer?.display_name}`}
                trigger={
                    <Button size="icon" variant="ghost">
                        <Edit className="h-5 w-5" />
                    </Button>
                }
                onOpenChange={editState.setOpen}
            >
                <CustomerForm current={customer} type="update" onClose={editState.close} />
            </SheetDrawer>
            <ConfirmDrawer
                open={deleteState.isOpen}
                onOpenChange={deleteState.setOpen}
                trigger={
                    <Button size="icon" variant="ghost">
                        <Trash2 className="text-red-500 h-5 w-5 cursor-pointer" />
                    </Button>
                }
                onClose={deleteState.close}
                onConfirm={onConfirmDelete}
                title={`Delete ${customer.display_name}`}
                description="This action cannot be undone. This will permanently delete the customer record."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default CustomerActions;
