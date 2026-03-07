import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Package, Search } from "lucide-react";
import { listBales, type BaleDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useOverlayTriggerState } from "react-stately";
import SheetDrawer from "@/components/ui/sheet-drawer";
import BaleForm from "@/components/bales/bale-form";

interface BaleRow {
    id: number;
    reference: string;
    purchaseDate: string;
    totalItems: number;
    remainingItems: number;
    totalCost: number;
}

export default function BalesPage() {
    const editState = useOverlayTriggerState({});

    const {
        data: baleDtos,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["bales"],
        queryFn: listBales,
    });

    const [search, setSearch] = useState("");

    const bales: BaleRow[] =
        baleDtos?.map((b: BaleDto) => {
            const totalItems = b.items?.reduce((sum, i) => sum + i.quantity, 0) ?? b.total_items ?? 0;
            return {
                id: b.id,
                reference: b.reference,
                purchaseDate: b.created_at?.slice(0, 10) ?? "",
                totalItems,
                remainingItems: b.remaining_items ?? totalItems,
                totalCost: b.purchase_price,
            };
        }) ?? [];

    const filteredBales = bales.filter((b) => b.reference.toLowerCase().includes(search.toLowerCase()));

    const stockPercent = (b: BaleRow) => (b.totalItems ? Math.round((b.remainingItems / b.totalItems) * 100) : 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Bale Management</h1>
                    <p className="page-subtitle">Track and manage your clothing bales</p>
                </div>
                <SheetDrawer
                    open={editState.isOpen}
                    title="Add New Bale"
                    trigger={
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Bale
                        </Button>
                    }
                    onOpenChange={editState.setOpen}
                >
                    <BaleForm onClose={editState.close} />
                </SheetDrawer>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search bales..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="grid gap-4">
                {isLoading && <p className="text-sm text-muted-foreground">Loading bales...</p>}
                {isError && <p className="text-sm text-destructive">Failed to load bales. Please try again.</p>}

                {/* Mobile cards + Desktop table */}
                <div className="hidden md:block">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="text-left p-3 font-medium text-muted-foreground">Reference</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Cost</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBales.map((bale) => (
                                            <tr key={bale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="p-3 font-mono text-xs font-medium">{bale.reference}</td>
                                                <td className="p-3">{bale.purchaseDate || "—"}</td>
                                                <td className="p-3">{bale.totalItems}</td>
                                                <td className="p-3 font-medium">{currency(bale.totalCost)}</td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant={
                                                            bale.remainingItems === 0
                                                                ? "destructive"
                                                                : bale.remainingItems < 20
                                                                  ? "secondary"
                                                                  : "default"
                                                        }
                                                        className="text-xs font-normal"
                                                    >
                                                        {bale.remainingItems === 0 ? "Sold Out" : bale.remainingItems < 20 ? "Low" : "In Stock"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                    {filteredBales.map((bale) => (
                        <Card key={bale.id} className="animate-slide-in">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-primary" />
                                        <span className="font-mono text-sm font-medium">{bale.reference}</span>
                                    </div>
                                    <Badge
                                        variant={bale.remainingItems === 0 ? "destructive" : bale.remainingItems < 20 ? "secondary" : "default"}
                                        className="text-xs"
                                    >
                                        {bale.remainingItems === 0 ? "Sold Out" : bale.remainingItems < 20 ? "Low" : "In Stock"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-medium">{bale.totalItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Cost</p>
                                        <p className="font-medium">{currency(bale.totalCost)}</p>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${stockPercent(bale)}%`,
                                            backgroundColor:
                                                stockPercent(bale) > 30
                                                    ? "hsl(152, 60%, 40%)"
                                                    : stockPercent(bale) > 0
                                                      ? "hsl(38, 92%, 50%)"
                                                      : "hsl(0, 72%, 51%)",
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
