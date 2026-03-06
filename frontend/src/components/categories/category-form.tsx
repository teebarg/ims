import React, { forwardRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Category } from "@/schema/category";

const CategoryFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

interface Props {
    current?: Category;
    type?: "create" | "update";
    onClose?: () => void;
}

type ChildRef = {};

const CategoryForm = forwardRef<ChildRef, Props>(({ type = "create", onClose, current }, ref) => {
    const queryClient = useQueryClient();
    const isCreate = type === "create";
    const defaultValues = React.useMemo<CategoryFormValues>(
        () => ({
            name: current?.name || "",
        }),
        [current]
    );

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(CategoryFormSchema),
        defaultValues,
    });

    const { handleSubmit, reset, control } = form;

    const createMutation = useMutation({
        mutationFn: async (data: CategoryFormValues) => await fetchApi<Category>("/categories/", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            toast.success("Category created successfully");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (error) => {
            toast.error("Failed to create category" + error);
        },
    });
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: CategoryFormValues }) => await fetchApi<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        onSuccess: () => {
            toast.success("Category updated successfully");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (error) => {
            toast.error("Failed to update category" + error);
        },
    });
    const isPending = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        reset(defaultValues);
    }, [defaultValues, reset]);

    useEffect(() => {
        if (createMutation.isSuccess || updateMutation.isSuccess) {
            reset();
            onClose?.();
        }
    }, [createMutation.isSuccess, updateMutation.isSuccess]);

    const onSubmit = async (data: CategoryFormValues) => {
        if (isCreate) {
            createMutation.mutate(data);
        } else if (current?.id) {
            updateMutation.mutate({ id: current.id, data });
        }
    };

    return (
        <Form {...form}>
            <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6 flex-1 overflow-auto px-2 pb-4">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex. Gown" {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="sheet-footer">
                    <Button aria-label="cancel" className="min-w-32" disabled={isPending} type="button" variant="destructive" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button aria-label="submit" className="min-w-32" isLoading={isPending} type="submit">
                        {isCreate ? "Submit" : "Update"}
                    </Button>
                </div>
            </form>
        </Form>
    );
});

CategoryForm.displayName = "CategoryForm";

export { CategoryForm };
