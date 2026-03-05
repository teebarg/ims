import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Package, Search } from "lucide-react";
import { createBale, listBales, type BaleDto } from "@/lib/api";
import { toast } from "sonner";

interface BaleRow {
    id: number;
    reference: string;
    purchaseDate: string;
    totalItems: number;
    remainingItems: number;
    totalCost: number;
}

export default function BalesPage() {
    const queryClient = useQueryClient();

    const { data: baleDtos, isLoading, isError } = useQuery({
        queryKey: ["bales"],
        queryFn: listBales,
    });

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [newBale, setNewBale] = useState({
        totalItems: "",
        totalCost: "",
        purchaseDate: "",
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const totalItems = Number(newBale.totalItems);
            const totalCost = Number(newBale.totalCost);
            if (!Number.isFinite(totalItems) || totalItems <= 0 || !Number.isFinite(totalCost) || totalCost <= 0) {
                throw new Error("Please enter valid totals");
            }

            const reference = `BL-${Date.now()}`;

            return createBale({
                reference,
                // TODO: when categories are exposed in the UI, pass a real category instead of a generic one.
                category: "Mixed",
                // These numeric fields mirror the backend BaleCreate schema.
                purchase_price: totalCost,
                total_items: totalItems,
            } as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bales"] });
            setNewBale({ totalItems: "", totalCost: "", purchaseDate: "" });
            setOpen(false);
            toast.success("Bale created");
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to create bale";
            toast.error(message);
        },
    });

    const bales: BaleRow[] =
        baleDtos?.map((b: BaleDto) => ({
            id: b.id,
            reference: b.reference,
            purchaseDate: b.created_at?.slice(0, 10) ?? "",
            totalItems: b.total_items,
            // Until we have per-bale stock tracking, assume all items are currently in stock
            remainingItems: b.total_items,
            totalCost: b.purchase_price,
        })) ?? [];

    const filteredBales = bales.filter(
        (b) =>
            b.reference.toLowerCase().includes(search.toLowerCase()) ||
            `BL-${String(b.id).padStart(3, "0")}`.toLowerCase().includes(search.toLowerCase()),
    );

    const stockPercent = (b: BaleRow) => (b.totalItems ? Math.round((b.remainingItems / b.totalItems) * 100) : 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">Bale Management</h1>
                    <p className="page-subtitle">Track and manage your clothing bales</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Bale
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Add New Bale</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Total Items</Label>
                                    <Input
                                        type="number"
                                        value={newBale.totalItems}
                                        onChange={(e) => setNewBale((p) => ({ ...p, totalItems: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Total Cost ($)</Label>
                                    <Input
                                        type="number"
                                        value={newBale.totalCost}
                                        onChange={(e) => setNewBale((p) => ({ ...p, totalCost: e.target.value }))}
                                    />
                                </div>
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
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Saving..." : "Add Bale"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search bales..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="grid gap-4">
                {isLoading && (
                    <p className="text-sm text-muted-foreground">Loading bales...</p>
                )}
                {isError && (
                    <p className="text-sm text-destructive">Failed to load bales. Please try again.</p>
                )}

                {/* Mobile cards + Desktop table */}
                <div className="hidden md:block">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="text-left p-3 font-medium text-muted-foreground">Bale ID</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Remaining</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Cost</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBales.map((bale) => (
                                            <tr key={bale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="p-3 font-mono text-xs font-medium">
                                                    BL-{String(bale.id).padStart(3, "0")}
                                                </td>
                                                <td className="p-3">{bale.purchaseDate || "—"}</td>
                                                <td className="p-3">{bale.totalItems}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span>{bale.remainingItems}</span>
                                                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
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
                                                    </div>
                                                </td>
                                                <td className="p-3 font-medium">${bale.totalCost}</td>
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
                                        <span className="font-mono text-sm font-medium">
                                            BL-{String(bale.id).padStart(3, "0")}
                                        </span>
                                    </div>
                                    <Badge
                                        variant={bale.remainingItems === 0 ? "destructive" : bale.remainingItems < 20 ? "secondary" : "default"}
                                        className="text-xs"
                                    >
                                        {bale.remainingItems === 0 ? "Sold Out" : bale.remainingItems < 20 ? "Low" : "In Stock"}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-medium">{bale.totalItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Remaining</p>
                                        <p className="font-medium">{bale.remainingItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Cost</p>
                                        <p className="font-medium">${bale.totalCost}</p>
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
