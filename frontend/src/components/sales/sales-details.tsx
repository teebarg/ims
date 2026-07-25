import { useQuery } from "@tanstack/react-query";
import { listCategories, type CategoryDto, type SaleItemDto } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useOverlayTriggerState } from "react-stately";
import SheetDrawer from "../ui/sheet-drawer";
import { Check, Eye, ImageDown, Loader2, MessageCircle, Receipt, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { buildInvoiceMessage, formatPhoneForWhatsApp } from "@/lib/invoice";
import { generateInvoiceImage, shareOrDownloadInvoiceImage } from "@/lib/invoice-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import InvoiceReceipt from "../invoice/InvoiceReceipt";

interface SalesDetailsProps {
    items: SaleItemDto[];
    label?: string;
    total?: number;
    customerName?: string
    customerPhone?: any
}

export default function SalesDetails({ items, label = "View details", total, customerName, customerPhone }: SalesDetailsProps) {
    const state = useOverlayTriggerState({});
    const [copied, setCopied] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    console.log("🚀 ~ SalesDetails ~ receiptRef:", receiptRef)

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: listCategories,
    });

    const categoryNameById = new Map<number, string>((categories as CategoryDto[]).map((c) => [c.id, c.name]));
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    const getMessage = () => buildInvoiceMessage({ items, categoryNameById, total: total || 0, customerName });

    const handleSendWhatsApp = () => {
        const message = getMessage();
        const phone = customerPhone ? formatPhoneForWhatsApp(customerPhone) : null;
        const url = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    const handleShareText = async () => {
        const message = getMessage();
        if (navigator.share) {
            try { await navigator.share({ title: "Sale receipt", text: message }); } catch { }
            return;
        }
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const handleShareImage = async () => {
        if (!receiptRef.current) return;
        setIsGenerating(true);
        try {
            const blob = await generateInvoiceImage(receiptRef.current);
            await shareOrDownloadInvoiceImage(blob, `receipt-${Date.now()}.png`, `Your receipt from ${import.meta.env.VITE_APP_NAME}`);
        } catch (err) {
            console.error("Failed to share invoice image", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
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
                    <div className="flex gap-2 py-2 px-2">
                        <Button variant="secondary" className="gap-2" onClick={handleShareText}>
                            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                            {copied ? "Copied" : "Share text"}
                        </Button>
                        <Button variant="secondary" className="gap-2" onClick={() => setPreviewOpen(true)}>
                            <ImageDown className="h-4 w-4" />
                            Invoice image
                        </Button>
                        <Button className="gap-2" onClick={handleSendWhatsApp}>
                            <MessageCircle className="h-4 w-4" />
                            {customerPhone ? "Send via WhatsApp" : "Find on WhatsApp"}
                        </Button>
                    </div>
                    <div className="sheet-footer">
                        <Button variant="outline" onClick={state.close}>Close</Button>
                    </div>
                </div>
            </SheetDrawer>
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-fit p-0 overflow-hidden">
                    <DialogHeader className="px-4 pt-4 sr-only">
                        <DialogTitle>Invoice preview</DialogTitle>
                    </DialogHeader>
                    <InvoiceReceipt
                        ref={receiptRef}
                        items={items}
                        categoryNameById={categoryNameById}
                        total={total || 0}
                        customerName={customerName}
                    />
                    <div className="flex gap-2 p-4 pt-0">
                        <Button variant="outline" className="flex-1" onClick={() => setPreviewOpen(false)}>Close</Button>
                        <Button className="flex-1 gap-2" onClick={handleShareImage} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                            {isGenerating ? "Generating..." : "Share image"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
