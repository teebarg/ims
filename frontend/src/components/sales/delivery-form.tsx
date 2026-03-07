import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
import DeliveryTimeline from "./delivery-timeline";
import PaymentForm from "./payment-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { DeliveryStatus, SaleStatus } from "@/types/customer";
import { toast } from "sonner";

interface DeliveryFormProps {
    sale: SaleDto;
    status: SaleStatus;
    displayName: string;
    onClose?: () => void;
}

const RIDERS = ["Theophilus", "Daniel", "GUO", "Iyare Park"];

export default function DeliveryForm({ sale, displayName, status, onClose }: DeliveryFormProps) {
    const queryClient = useQueryClient();

    const [showDispatch, setShowDispatch] = useState(false);
    const [rider, setRider] = useState("");
    const [notes, setNotes] = useState("");

    const deliveryMutation = useMutation({
        mutationFn: (payload: { delivery_status?: DeliveryStatus; delivery_assigned_to?: string; delivery_notes?: string }) =>
            updateSaleDeliveryApi(sale.id, {
                ...payload,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            toast.success("Delivery updated");
            setShowDispatch(false);
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : "Failed to update delivery");
        },
    });

    const dispatchRider = () => {
        if (status !== "paid") {
            toast.error("Order must be paid before dispatch");
            return;
        }

        setShowDispatch(true);
    };

    const confirmDispatch = () => {
        if (!rider) {
            toast.error("Please select a rider");
            return;
        }

        deliveryMutation.mutate({
            delivery_status: "out_for_delivery",
            delivery_assigned_to: rider,
            delivery_notes: notes,
        });
    };

    const markDelivered = () => {
        deliveryMutation.mutate({
            delivery_status: "delivered",
        });
    };

    return (
        <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-1 gap-6 flex-1 overflow-auto">
                <PaymentForm sale={sale} status={status} displayName={displayName} onClose={onClose} />

                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Delivery Tracking</h4>
                        <DeliveryTimeline sale={sale} />
                    </div>

                    <div className="space-y-3 p-3 rounded-lg border bg-card">
                        <div className="text-xs text-muted-foreground">
                            Current Status: <span className="font-semibold">{status}</span>
                        </div>

                        {sale.delivery_status?.toLowerCase() === "processing" && !showDispatch && (
                            <button className="h-9 w-full rounded-md bg-primary text-primary-foreground text-xs font-medium" onClick={dispatchRider}>
                                Dispatch Rider
                            </button>
                        )}

                        {/* DISPATCH FORM */}
                        {showDispatch && (
                            <>
                                <div>
                                    <Label className="text-xs">Assign Rider</Label>

                                    <Select value={rider} onValueChange={setRider}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select rider..." />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {RIDERS.map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {r}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Delivery Notes</Label>

                                    <Textarea
                                        className="min-h-[60px] text-xs"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Optional notes..."
                                    />
                                </div>

                                <button
                                    className="h-9 w-full rounded-md bg-primary text-primary-foreground text-xs font-medium"
                                    onClick={confirmDispatch}
                                >
                                    Confirm Dispatch
                                </button>
                            </>
                        )}

                        {sale.delivery_status === "out_for_delivery" && (
                            <button className="h-9 w-full rounded-md bg-green-600 text-white text-xs font-medium" onClick={markDelivered}>
                                Mark Delivered
                            </button>
                        )}

                        {sale.delivery_status === "delivered" && <div className="text-xs text-green-600 font-medium">Order completed</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
