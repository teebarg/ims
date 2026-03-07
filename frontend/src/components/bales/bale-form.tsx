import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBale, createCategory, listCategories } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "../ui/badge";

interface Props {
    onClose?: () => void;
}

export default function BaleForm({ onClose }: Props) {
    const queryClient = useQueryClient();
    const [customCategory, setCustomCategory] = useState("");

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

            const items = baleCategories
                .map((c) => ({
                    category_id: Number(typeof c.name === "string" ? c.name : ""),
                    quantity: Number(c.quantity) || 0,
                }))
                .filter((item) => Number.isFinite(item.category_id) && item.category_id > 0 && item.quantity > 0);

            if (items.length === 0) {
                throw new Error("Add at least one category with quantity");
            }

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

    const addRow = () => setBaleCategories((prev) => [...prev, { name: "", quantity: 0 }]);

    const removeRow = (idx: number) => setBaleCategories((prev) => prev.filter((_, i) => i !== idx));

    const updateRow = (idx: number, field: keyof (typeof baleCategories)[0], value: string | number) => {
        setBaleCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    };

    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => createCategory({ name: name.trim() }),
        onSuccess: (newCategory) => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setBaleCategories((prev) => [...prev, { name: String(newCategory.id), quantity: 0 }]);
            setCustomCategory("");
            toast.success(`Category "${newCategory.name}" added`);
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to create category";
            toast.error(message);
        },
    });

    const addCustomCategory = () => {
        const name = customCategory.trim();
        if (!name) return;
        createCategoryMutation.mutate(name);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-6 flex-1 overflow-auto px-4 pb-24">
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
                    {/* Category Items */}
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
                                                {categories.map((k) => (
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
                            <Button variant="outline" size="sm" onClick={addRow} className="text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </Button>
                        </div>

                        {/* New category creator */}
                        <div className="border border-dashed border-border rounded-md p-3 space-y-2">
                            <Label className="text-xs text-muted-foreground">New Category</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Scarves"
                                    className="h-8 text-sm flex-1"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs"
                                    disabled={!customCategory.trim() || createCategoryMutation.isPending}
                                    onClick={addCustomCategory}
                                >
                                    {createCategoryMutation.isPending ? "Adding…" : "Add"}
                                </Button>
                            </div>
                        </div>
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
