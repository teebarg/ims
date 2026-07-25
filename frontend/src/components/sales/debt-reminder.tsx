import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCategories, type CategoryDto, type SaleDto } from "@/lib/api";
import { toOutstandingSales, buildDebtReminderMessage, formatPhoneForWhatsApp } from "@/lib/invoice";
import { generateInvoiceImage, shareOrDownloadInvoiceImage } from "@/lib/invoice-image";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ImageDown, Loader2, MessageCircle } from "lucide-react";
import DebtStatement from "@/components/invoice/DebtStatement";

export default function CustomerDebtReminder({ sales, customerName, customerPhone }: {
    sales: SaleDto[];
    customerName?: string;
    customerPhone?: string;
}) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const statementRef = useRef<HTMLDivElement>(null);

    const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
    const categoryNameById = new Map<number, string>((categories as CategoryDto[]).map((c) => [c.id, c.name]));

    const outstanding = toOutstandingSales(sales, categoryNameById);
    const totalOwed = outstanding.reduce((sum, s) => sum + s.balance, 0);

    if (totalOwed <= 0) return null;

    // const handleSendWhatsApp = () => {
    //     const message = buildDebtReminderMessage({ customerName, sales: outstanding });
    //     const phone = customerPhone ? formatPhoneForWhatsApp(customerPhone) : null;
    //     const url = phone
    //         ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    //         : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    //     window.open(url, "_blank");
    // };

    const handleShareImage = async () => {
        if (!statementRef.current) return;
        setIsGenerating(true);
        try {
            const blob = await generateInvoiceImage(statementRef.current);
            await shareOrDownloadInvoiceImage(blob, `statement-${Date.now()}.png`, `Outstanding balance from ${import.meta.env.VITE_APP_NAME}`);
        } catch (err) {
            console.error("Failed to share debt statement image", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Button size="sm" variant="destructive" className="gap-2" onClick={() => setPreviewOpen(true)}>
                <AlertCircle className="h-4 w-4" />
                Send reminder · {currency(totalOwed)}
            </Button>

            <div style={{ position: "fixed", top: 0, left: -9999, pointerEvents: "none" }}>
                <DebtStatement ref={statementRef} customerName={customerName} sales={outstanding} />
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-fit p-0 overflow-hidden">
                    <DialogHeader className="px-4 pt-4">
                        <DialogTitle>Preview</DialogTitle>
                    </DialogHeader>
                    <DebtStatement customerName={customerName} sales={outstanding} />
                    <div className="flex gap-2 p-4 pt-0">
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
                        <Button className="gap-2" onClick={handleShareImage} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
                            Share Image
                        </Button>
                        {/* <Button className="flex-1 gap-2" onClick={handleSendWhatsApp}>
                            <MessageCircle className="h-4 w-4" />
                            {customerPhone ? "Send via WhatsApp" : "Find on WhatsApp"}
                        </Button> */}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}