import type React from "react";
import { useOverlayTriggerState } from "react-stately";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { Category } from "@/schema/category";
import SheetDrawer from "../ui/sheet-drawer";
import { CategoryForm } from "./category-form";
import { ConfirmDrawer } from "../ui/confirm-drawer";

interface Props {
    category: Category;
}

const CategoryAction: React.FC<Props> = ({ category }) => {
    const queryClient = useQueryClient();
    const deleteState = useOverlayTriggerState({});
    const editState = useOverlayTriggerState({});
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await fetchApi(`/categories/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            toast.success("Category deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (error) => {
            toast.error("Failed to delete category" + error);
        },
    });

    const onConfirmDelete = async () => {
        if (!category) {
            return;
        }
        deleteMutation.mutateAsync(category.id).then(() => {
            deleteState.close();
        });
    };

    return (
        <div className="flex items-center flex-wrap">
            <SheetDrawer
                open={editState.isOpen}
                title={`Edit Category ${category?.name}`}
                trigger={
                    <Button size="icon" variant="ghost">
                        <Edit className="h-5 w-5" />
                    </Button>
                }
                onOpenChange={editState.setOpen}
            >
                <CategoryForm current={category} type="update" onClose={editState.close} />
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
                title={`Delete ${category.name}`}
                description="This action cannot be undone. This will permanently delete the category and all its subcategories."
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default CategoryAction;
