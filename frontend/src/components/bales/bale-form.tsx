import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBale, listCategories } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import CategoryInlineForm from "../categories/category-inline-form";

interface Props {
    onClose?: () => void;
}

export default function BaleForm({ onClose }: Props) {
    const queryClient = useQueryClient();

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: listCategories,
    });

    const [newBale, setNewBale] = useState({
        reference: "",
        categoryId: "",
        totalItems: "",
        totalCost: "",
        purchaseDate: "",
    });
    const [baleCategories, setBaleCategories] = useState<any[]>([{ name: "", quantity: 0 }]);
    const createMutation = useMutation({
        mutationFn: async () => {
            const ref = newBale.reference.trim();
            if (!ref) throw new Error("Please enter a reference for the bale");

            const totalCost = Number(newBale.totalCost);
            if (!Number.isFinite(totalCost) || totalCost <= 0) {
                throw new Error("Please enter a valid total cost");
            }

            const usedCategoryIds = new Set<string>();
            const items = baleCategories.map((c) => {
                const categoryId = c.name;
                const quantity = Number(c.quantity) || 0;

                if (!categoryId) throw new Error("Select a category for all rows");
                if (usedCategoryIds.has(categoryId)) throw new Error("Duplicate categories are not allowed");
                if (quantity <= 0) throw new Error("Quantity must be greater than 0 for all categories");

                usedCategoryIds.add(categoryId);

                return {
                    category_id: Number(categoryId),
                    quantity,
                };
            });

            return createBale({
                reference: ref,
                purchase_price: totalCost,
                items,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bales"] });
            setNewBale({ reference: "", categoryId: "", totalItems: "", totalCost: "", purchaseDate: "" });
            setBaleCategories([{ name: "", quantity: 0 }]);
            onClose?.();
            toast.success("Bale created");
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to create bale";
            toast.error(message);
        },
    });

    const computedTotal = baleCategories.reduce((sum, c) => sum + (c.quantity || 0), 0);

    const addRow = () => {
        const usedIds = baleCategories.map((c) => c.name);
        const remainingCategory = categories.find((c) => !usedIds.includes(c.id.toString()))?.id.toString() || "";
        if (!remainingCategory) return; // nothing to add
        setBaleCategories((prev) => [...prev, { name: remainingCategory, quantity: 0 }]);
    };

    const removeRow = (idx: number) => setBaleCategories((prev) => prev.filter((_, i) => i !== idx));
    const updateRow = (idx: number, field: keyof (typeof baleCategories)[0], value: string | number) => {
        setBaleCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    };

    const allCategoriesUsed = useMemo(() => {
        const usedIds = baleCategories.map((c) => c.name);
        return categories.length > 0 && usedIds.length >= categories.length;
    }, [baleCategories, categories]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-6 flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="bale-reference">Reference</Label>
                        <Input
                            id="bale-reference"
                            placeholder="e.g. BL-001 or Summer-2024"
                            value={newBale.reference}
                            onChange={(e) => setNewBale((p) => ({ ...p, reference: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Total Cost (₦)</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={newBale.totalCost}
                                onChange={(e) => setNewBale((p) => ({ ...p, totalCost: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Purchase Date</Label>
                            <Input
                                type="date"
                                value={newBale.purchaseDate}
                                onChange={(e) => setNewBale((p) => ({ ...p, purchaseDate: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Category Breakdown</Label>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {computedTotal} items
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {baleCategories.map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-1">
                                    <div className="flex-1">
                                        <Select value={cat.name} onValueChange={(v) => updateRow(idx, "name", v)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories
                                                    .filter((k) => !baleCategories.some((bc, i) => bc.name === k.id.toString() && i !== idx))
                                                    .map((k) => (
                                                        <SelectItem key={k.id} value={k.id.toString()}>
                                                            {k.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Qty"
                                        className="w-20 h-9 text-sm"
                                        value={cat.quantity || ""}
                                        onChange={(e) => updateRow(idx, "quantity", Math.max(0, Number(e.target.value)))}
                                    />
                                    {baleCategories.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeRow(idx)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={addRow} className="text-xs" disabled={allCategoriesUsed}>
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </Button>
                        </div>

                        <CategoryInlineForm
                            onCreate={(category) => {
                                setBaleCategories((prev) => [...prev, { name: String(category.id), quantity: 0 }]);
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="sheet-footer">
                <Button
                    aria-label="cancel"
                    className="min-w-32"
                    disabled={createMutation.isPending}
                    type="button"
                    variant="destructive"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Add Bale"}
                </Button>
            </div>
        </div>
    );
}
