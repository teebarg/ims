import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { listCategories, updateSaleItems, type SaleDto } from "@/lib/api";
import { toast } from "sonner";
import { currency } from "@/lib/utils";
import CategoryInlineForm from "../categories/category-inline-form";

interface EditLineItem {
    id?: number;
    categoryId: number | null;
    quantity: number;
    amount: number;
}

interface SalesEditFormProps {
    sale: SaleDto;
    displayName: string;
    onClose: () => void;
}

const emptyLineItem = (): EditLineItem => ({ categoryId: null, quantity: 1, amount: 0 });

export default function SalesEditForm({ sale, displayName, onClose }: SalesEditFormProps) {
    const queryClient = useQueryClient();
    const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

    const [lineItems, setLineItems] = useState<EditLineItem[]>([]);

    useEffect(() => {
        setLineItems(
            sale.items.map((item) => ({
                id: item.id,
                categoryId: item.category_id,
                quantity: item.quantity,
                amount: Number(item.amount),
            }))
        );
    }, [sale]);

    const computedTotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    const totalItemCount = lineItems.reduce((sum, li) => sum + li.quantity, 0);
    const totalPaid = Number(sale.total_paid);
    const totalBelowPaid = computedTotal < totalPaid;

    const updateLineItem = (index: number, field: keyof EditLineItem, value: number | null) => {
        setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)));
    };

    const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
    const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

    const lineItemsValid =
        lineItems.length > 0 && lineItems.every((li) => li.categoryId && li.quantity > 0 && li.amount > 0);
    const canAddMore = lineItems.length < categories.length;

    const updateMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                items: lineItems.map((li) => ({
                    id: li.id ?? null,
                    category_id: li.categoryId!,
                    quantity: li.quantity,
                    amount: li.amount,
                })),
            };
            return updateSaleItems(sale.id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Sale items updated");
            onClose();
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to update sale items");
        },
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-mono font-medium">{sale.reference}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer</span>
                        <span className="font-medium">{displayName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Already paid</span>
                        <span>{currency(totalPaid)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Line items</Label>
                    <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                        <span>Category</span>
                        <span>Qty</span>
                        <span>Amount (₦)</span>
                        <span></span>
                    </div>
                    {lineItems.map((li, i) => {
                        const selectedCategoryIds = lineItems.map((item) => item.categoryId).filter(Boolean);

                        const availableCategories = categories.filter(
                            (cat) => !selectedCategoryIds.includes(cat.id) || cat.id === li.categoryId
                        );

                        return (
                            <div key={li.id ?? `new-${i}`} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center">
                                <Select
                                    value={li.categoryId ? String(li.categoryId) : ""}
                                    onValueChange={(v) => updateLineItem(i, "categoryId", Number(v))}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="number"
                                    min={1}
                                    className="h-9 text-xs"
                                    value={li.quantity || ""}
                                    onChange={(e) => updateLineItem(i, "quantity", Math.max(0, Number(e.target.value)))}
                                />

                                <Input
                                    type="number"
                                    min={0}
                                    className="h-9 text-xs"
                                    value={li.amount || ""}
                                    onChange={(e) => updateLineItem(i, "amount", Math.max(0, Number(e.target.value)))}
                                    placeholder="0"
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    disabled={lineItems.length <= 1}
                                    onClick={() => removeLineItem(i)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <Button type="button" disabled={!canAddMore} variant="outline" size="sm" className="w-full" onClick={addLineItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>

                <CategoryInlineForm />

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
                    <span className="text-sm font-medium">New total ({totalItemCount} items)</span>
                    <span className="font-heading text-lg font-bold text-primary">{currency(computedTotal)}</span>
                </div>

                {totalBelowPaid && (
                    <p className="text-xs text-destructive">
                        New total cannot be less than {currency(totalPaid)} already paid.
                    </p>
                )}
            </div>

            <div className="sheet-footer justify-between">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending || !lineItemsValid || totalBelowPaid}
                >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
