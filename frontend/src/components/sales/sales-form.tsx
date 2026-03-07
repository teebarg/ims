import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowRight, ArrowLeft, Check, Trash2 } from "lucide-react";
import { channelLabels, SaleLineItem } from "@/types/customer";
import { listCustomers, createSale, createPayment, type ApiSalesChannel, fetchApi } from "@/lib/api";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { CustomerForm } from "@/components/customers/customer-form";
import { toast } from "sonner";
import { currency } from "@/lib/utils";
import { Category } from "@/schema/category";
import { Channel } from "@/types/customer";

function uiToApiChannel(ch: Channel): ApiSalesChannel {
    switch (ch) {
        case "shop":
            return "SHOP";
        case "tiktok":
            return "TIKTOK";
        case "instagram":
            return "INSTAGRAM";
        case "website":
            return "WEBSITE";
    }
}

const emptyLineItem = (): SaleLineItem => ({ category: "", quantity: 1, amount: 0 });

export default function SalesForm() {
    const queryClient = useQueryClient();

    const saleState = useOverlayTriggerState({});
    const createCustomerState = useOverlayTriggerState({});
    const confirmSaleState = useOverlayTriggerState({});

    const [step, setStep] = useState(1);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    // Step 2: Line items
    const [lineItems, setLineItems] = useState<SaleLineItem[]>([emptyLineItem()]);
    const [saleChannel, setSaleChannel] = useState<Channel>("shop");
    const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

    // Step 3: Payment
    const [salePaid, setSalePaid] = useState("");

    const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
    const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => fetchApi<Category[]>("/categories/") });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const filteredCustomers = customers.filter(
        (c) =>
            c.display_name.toLowerCase().includes(customerSearch.toLowerCase()) || c.identifier.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const computedTotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    const totalItemCount = lineItems.reduce((sum, li) => sum + li.quantity, 0);

    const updateLineItem = (index: number, field: keyof SaleLineItem, value: string | number) => {
        setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)));
    };

    const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
    const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

    const lineItemsValid = lineItems.length > 0 && lineItems.every((li) => li.category && li.quantity > 0 && li.amount > 0);
    const canAddMore = lineItems.length < categories.length;

    const resetSaleForm = () => {
        setStep(1);
        setSelectedCustomerId(null);
        setCustomerSearch("");
        setSaleChannel("shop");
        setSaleDate(new Date().toISOString().slice(0, 10));
        setSalePaid("");
    };

    const createSaleMutation = useMutation({
        mutationFn: async () => {
            if (!selectedCustomerId) throw new Error("Select customer");
            const qty = Number(totalItemCount);
            const total = Number(computedTotal);
            if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(total) || total <= 0) {
                throw new Error("Enter valid quantity and total");
            }
            // Map selected category names to their IDs from the API
            const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
            const payload = {
                customer_id: selectedCustomerId,
                channel: uiToApiChannel(saleChannel),
                sale_date: saleDate || null,
                items: lineItems.map((li) => ({
                    category_id: (() => {
                        const id = categoryByName.get(li.category);
                        if (!id) {
                            throw new Error(`Unknown category: ${li.category}`);
                        }
                        return id;
                    })(),
                    quantity: li.quantity,
                    amount: li.amount,
                })),
            };
            const sale = await createSale(payload);
            const paid = Number(salePaid) || 0;
            if (paid > 0 && Number(sale.balance) >= paid) {
                await createPayment({ sale_id: sale.id, amount: paid, method: "cash" });
            }
            return sale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            resetSaleForm();
            confirmSaleState.close();
            saleState.close();
            toast.success("Sale recorded");
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to record sale");
        },
    });

    const handleConfirmSale = () => {
        confirmSaleState.open();
    };
    const handleSubmitSale = () => {
        createSaleMutation.mutate();
    };

    const selectedCustomer = selectedCustomerId ? customerMap.get(selectedCustomerId) : null;
    const totalNum = Number(computedTotal) || 0;
    const paidNum = Number(salePaid) || 0;
    const balancePreview = totalNum - paidNum;
    const paymentExceedsTotal = paidNum > totalNum;

    return (
        <>
            <SheetDrawer
                open={saleState.isOpen}
                onOpenChange={saleState.setOpen}
                title="Record New Sale"
                trigger={
                    <Button
                        onClick={() => {
                            resetSaleForm();
                            saleState.open();
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Record Sale
                    </Button>
                }
            >
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pb-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-1.5">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                                        step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                                </div>
                                {s < 3 && <div className={`h-0.5 w-8 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
                            </div>
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">{step === 1 ? "Customer" : step === 2 ? "Details" : "Payment"}</span>
                    </div>
                    <div className="flex-1 overflow-auto px-4 pb-4 min-h-[220px]">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search customers..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-1">
                                    {filteredCustomers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                                selectedCustomerId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                            }`}
                                            onClick={() => setSelectedCustomerId(c.id)}
                                        >
                                            <div>
                                                <span className="font-medium">{c.display_name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">{c.identifier}</span>
                                            </div>
                                            {selectedCustomerId === c.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No customers found.</p>
                                    )}
                                </div>
                                <SheetDrawer
                                    open={createCustomerState.isOpen}
                                    onOpenChange={createCustomerState.setOpen}
                                    title="Create New Customer"
                                    trigger={
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Plus className="h-3 w-3 mr-1" /> Create New Customer
                                        </Button>
                                    }
                                >
                                    <CustomerForm type="create" onClose={createCustomerState.close} />
                                </SheetDrawer>
                                <p className="text-xs text-muted-foreground">
                                    New customers appear in the list after creation. Select them to continue.
                                </p>
                            </div>
                        )}
                        {/* Step 2 */}
                        {step === 2 && (
                            <div className="space-y-4">
                                {selectedCustomer && (
                                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
                                        <span className="font-medium">{selectedCustomer.display_name}</span>
                                        <span className="text-muted-foreground font-mono text-xs">{selectedCustomer.identifier}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Channel</Label>
                                        <Select value={saleChannel} onValueChange={(v: Channel) => setSaleChannel(v)}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="shop">Shop</SelectItem>
                                                <SelectItem value="tiktok">Tiktok</SelectItem>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="website">Website</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Date</Label>
                                        <Input type="date" className="h-9" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
                                    </div>
                                </div>

                                {/* Line items */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                        <span>Category</span>
                                        <span>Qty</span>
                                        <span>Amount ($)</span>
                                        <span></span>
                                    </div>
                                    {lineItems.map((li, i) => {
                                        const selectedCategories = lineItems.map((item) => item.category).filter(Boolean);

                                        const availableCategories = categories.filter(
                                            (cat: Category) => !selectedCategories.includes(cat.name) || cat.name === li.category
                                        );

                                        return (
                                            <div key={i} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center">
                                                <Select value={li.category} onValueChange={(v) => updateLineItem(i, "category", v)}>
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {availableCategories.map((cat: Category) => (
                                                            <SelectItem key={cat.id} value={cat.name}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Input
                                                    type="number"
                                                    min={1}
                                                    className="h-9 text-xs"
                                                    value={li.quantity}
                                                    onChange={(e) => updateLineItem(i, "quantity", Math.max(1, Number(e.target.value)))}
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

                                {/* Computed total */}
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
                                    <span className="text-sm font-medium">Total ({totalItemCount} items)</span>
                                    <span className="font-heading text-lg font-bold text-primary">{currency(computedTotal)}</span>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span className="font-medium">{selectedCustomer?.display_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items</span>
                                        <span>
                                            {totalItemCount} across {lineItems.length} categories
                                        </span>
                                    </div>
                                    {lineItems.map((li, i) => (
                                        <div key={i} className="flex justify-between text-xs pl-4">
                                            <span className="text-muted-foreground">
                                                {li.category} × {li.quantity}
                                            </span>
                                            <span>{currency(li.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-1 border-t">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-heading font-bold">{currency(computedTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Channel</span>
                                        <span>{channelLabels[saleChannel]}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label>Payment Amount ($)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={salePaid}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (val > totalNum) {
                                                setSalePaid(String(totalNum));
                                                return;
                                            }

                                            setSalePaid(e.target.value);
                                        }}
                                        placeholder="0"
                                        max={computedTotal}
                                        className={paymentExceedsTotal ? "border-destructive focus-visible:ring-destructive" : ""}
                                    />

                                    {paymentExceedsTotal && <p className="text-xs text-destructive mt-1">Payment cannot exceed total sale amount.</p>}
                                </div>
                                <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setSalePaid(String(totalNum))}>
                                    Pay Full Amount
                                </Button>
                                {computedTotal > 0 && (
                                    <div
                                        className={`p-3 rounded-lg text-sm font-medium flex justify-between ${
                                            paymentExceedsTotal
                                                ? "bg-destructive/10 text-destructive"
                                                : balancePreview <= 0
                                                  ? "bg-success/10 text-success"
                                                  : "bg-muted"
                                        }`}
                                    >
                                        <span>Balance after payment</span>
                                        <span>{currency(Math.max(0, balancePreview))}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between gap-2 px-4 py-4 border-t">
                        <div>
                            {step > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    resetSaleForm();
                                    saleState.close();
                                }}
                            >
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button
                                    onClick={() => setStep((s) => s + 1)}
                                    disabled={
                                        (step === 1 && !selectedCustomerId) || (step === 2 && (!totalItemCount || !computedTotal || !lineItemsValid))
                                    }
                                >
                                    Next <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleConfirmSale} disabled={createSaleMutation.isPending || paymentExceedsTotal}>
                                    <Check className="h-4 w-4 mr-1" /> Record Sale
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </SheetDrawer>

            {/* Sale confirmation */}
            <ConfirmDrawer
                open={confirmSaleState.isOpen}
                onOpenChange={confirmSaleState.setOpen}
                trigger={null}
                title="Confirm Sale"
                description="Please review and confirm the sale details."
                content={
                    <div className="space-y-2 text-sm mt-4 px-4 pb-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer</span>
                            <span className="font-medium">{selectedCustomer?.display_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity</span>
                            <span>{totalItemCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-heading font-bold">{currency(Number(computedTotal))}</span>
                        </div>
                        {paidNum > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Initial payment</span>
                                <span className="text-success">{currency(paidNum)}</span>
                            </div>
                        )}
                    </div>
                }
                confirmText="Confirm & Create Sale"
                cancelText="Cancel"
                variant="default"
                isLoading={createSaleMutation.isPending}
                onConfirm={handleSubmitSale}
                onClose={() => confirmSaleState.close()}
            />
        </>
    );
}
