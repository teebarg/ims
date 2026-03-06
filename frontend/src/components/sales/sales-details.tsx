import { useQuery } from "@tanstack/react-query";
import { listCategories, type CategoryDto, type SaleItemDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useOverlayTriggerState } from "react-stately";
import SheetDrawer from "../ui/sheet-drawer";
import { Eye, Receipt } from "lucide-react";

interface SalesDetailsProps {
    items: SaleItemDto[];
    label?: string;
    total?: number;
}

export default function SalesDetails({ items, label = "View details", total }: SalesDetailsProps) {
    const state = useOverlayTriggerState({});

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: listCategories,
    });

    const categoryNameById = new Map<number, string>((categories as CategoryDto[]).map((c) => [c.id, c.name]));
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <SheetDrawer
            open={state.isOpen}
            title="Sale Receipt"
            trigger={
                <Button size="sm" variant="ghost" className="gap-2">
                    <Eye className="h-4 w-4" />
                    {label}
                </Button>
            }
            onOpenChange={state.setOpen}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {items.length} items • {totalQty} qty
                    </span>
                </div>

                <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                    {items.map((item) => {
                        const name = categoryNameById.get(item.category_id) ?? `Category ${item.category_id}`;

                        return (
                            <div key={item.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{name}</Badge>

                                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                                    </div>

                                    <span className="font-semibold text-sm">{currency(item.amount)}</span>
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Unit</span>
                                    <span>{currency(item.amount / item.quantity)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-dashed" />

                <div className="px-4 py-4 space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Categories</span>
                        <span>{items.length}</span>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total quantity</span>
                        <span>{totalQty}</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{currency(total || 0)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="sheet-footer">
                    <Button variant="outline" onClick={state.close}>
                        Close
                    </Button>
                </div>
            </div>
        </SheetDrawer>
    );
}
