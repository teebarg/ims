import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/lib/api";
import { toast } from "sonner";

export default function CategoryInlineForm({ onCreate }: { onCreate?: (category: { id: number; name: string }) => void }) {
    const queryClient = useQueryClient();
    const [customCategory, setCustomCategory] = useState("");

    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => createCategory({ name: name.trim() }),
        onSuccess: (newCategory) => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            onCreate?.(newCategory);
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
    );
}
