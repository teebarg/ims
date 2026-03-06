import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBale, listCategories } from "@/lib/api";
import { toast } from "sonner";

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

    const createMutation = useMutation({
        mutationFn: async () => {
            const ref = newBale.reference.trim();
            if (!ref) throw new Error("Please enter a reference for the bale");

            const categoryId = Number(newBale.categoryId);
            if (!Number.isFinite(categoryId) || categoryId <= 0) {
                throw new Error("Please select a category");
            }

            const totalItems = Number(newBale.totalItems);
            const totalCost = Number(newBale.totalCost);
            if (!Number.isFinite(totalItems) || totalItems <= 0 || !Number.isFinite(totalCost) || totalCost <= 0) {
                throw new Error("Please enter valid totals");
            }

            return createBale({
                reference: ref,
                category_id: categoryId,
                purchase_price: totalCost,
                total_items: totalItems,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bales"] });
            setNewBale({ reference: "", categoryId: "", totalItems: "", totalCost: "", purchaseDate: "" });
            onClose?.();
            toast.success("Bale created");
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to create bale";
            toast.error(message);
        },
    });

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
                    <div>
                        <Label>Purchase Date</Label>
                        <Input
                            type="date"
                            value={newBale.purchaseDate}
                            onChange={(e) => setNewBale((p) => ({ ...p, purchaseDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label>Category</Label>
                        <Select value={newBale.categoryId || undefined} onValueChange={(value) => setNewBale((p) => ({ ...p, categoryId: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {categories.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">No categories yet. Add one from the Categories page.</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Total Items</Label>
                            <Input
                                type="number"
                                min={1}
                                value={newBale.totalItems}
                                onChange={(e) => setNewBale((p) => ({ ...p, totalItems: e.target.value }))}
                            />
                        </div>
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
