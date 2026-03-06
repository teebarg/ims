import React, { forwardRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, updateCustomer, type CustomerDto, type ApiIdentifierType } from "@/lib/api";
import { identifierTypeLabels, type IdentifierType } from "@/types/customer";

const IDENTIFIER_TYPES: IdentifierType[] = ["tiktok", "instagram", "street", "app"];

const CustomerFormSchema = z.object({
    display_name: z.string().min(1, "Display name is required"),
    identifier: z.string().min(1, "Identifier is required"),
    identifier_type: z.enum(["tiktok", "instagram", "street", "app"]),
    phone: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

function uiToApiIdentifierType(t: IdentifierType): ApiIdentifierType {
    switch (t) {
        case "tiktok":
            return "TIKTOK";
        case "instagram":
            return "INSTAGRAM";
        case "street":
            return "STREET";
        case "app":
            return "APP_USER";
    }
}

interface Props {
    current?: CustomerDto;
    type?: "create" | "update";
    onClose?: () => void;
}

const CustomerForm = forwardRef<object, Props>(({ type = "create", onClose, current }, ref) => {
    const queryClient = useQueryClient();
    const isCreate = type === "create";

    const defaultIdentifierType = (t: CustomerDto["identifier_type"]): IdentifierType => {
        switch (t) {
            case "TIKTOK":
                return "tiktok";
            case "INSTAGRAM":
                return "instagram";
            case "STREET":
                return "street";
            case "APP_USER":
                return "app";
            default:
                return "instagram";
        }
    };

    const defaultValues = React.useMemo<CustomerFormValues>(
        () => ({
            display_name: current?.display_name || "",
            identifier: current?.identifier || "",
            identifier_type: current ? defaultIdentifierType(current.identifier_type) : "instagram",
            phone: current?.phone ?? "",
        }),
        [current]
    );

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(CustomerFormSchema),
        defaultValues,
    });

    const { handleSubmit, reset, control } = form;

    const createMutation = useMutation({
        mutationFn: async (data: CustomerFormValues) =>
            createCustomer({
                display_name: data.display_name,
                identifier: data.identifier,
                identifier_type: uiToApiIdentifierType(data.identifier_type),
                phone: data.phone?.trim() || null,
            }),
        onSuccess: () => {
            toast.success("Customer created successfully");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to create customer");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CustomerFormValues }) =>
            updateCustomer(id, {
                display_name: data.display_name,
                identifier: data.identifier,
                identifier_type: uiToApiIdentifierType(data.identifier_type),
                phone: data.phone?.trim() || null,
            }),
        onSuccess: () => {
            toast.success("Customer updated successfully");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to update customer");
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
    }, [createMutation.isSuccess, updateMutation.isSuccess, reset, onClose]);

    const onSubmit = async (data: CustomerFormValues) => {
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
                        name="display_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Sarah Kimani" {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="identifier_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Identifier Type</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isPending}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {IDENTIFIER_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {identifierTypeLabels[t]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="identifier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Identifier</FormLabel>
                                <FormControl>
                                    <Input placeholder="@handle or nickname" {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone (optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="+254..." {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="sheet-footer">
                    <Button
                        aria-label="cancel"
                        className="min-w-32"
                        disabled={isPending}
                        type="button"
                        variant="destructive"
                        onClick={onClose}
                    >
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

CustomerForm.displayName = "CustomerForm";

export { CustomerForm };
