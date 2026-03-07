// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Label } from "@/components/ui/label";
// import { type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
// import DeliveryTimeline from "./delivery-timeline";
// import PaymentForm from "./payment-form";
// import { Textarea } from "../ui/textarea";
// import { apiToDeliveryStatus, type DeliveryStatus } from "@/types/customer";
// import { toast } from "sonner";

// interface DeliveryFormProps {
//     sale: SaleDto;
//     displayName: string;
//     onClose?: () => void;
// }

// const RIDERS = ["Kevin", "Brian", "James", "David"];

// export default function DeliveryForm({ sale, displayName, onClose }: DeliveryFormProps) {
//     const queryClient = useQueryClient();

//     const deliveryMutation = useMutation({
//         mutationFn: (payload: { delivery_status?: DeliveryStatus; delivery_assigned_to?: string; delivery_notes?: string }) =>
//             updateSaleDeliveryApi(sale.id, {
//                 ...payload,
//             }),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["sales"] });
//             toast.success("Delivery updated");
//         },
//         onError: (err: unknown) => {
//             toast.error(err instanceof Error ? err.message : "Failed to update delivery");
//         },
//     });

//     const updateSaleDelivery = (
//         _saleId: number,
//         payload: {
//             delivery_status?: DeliveryStatus;
//             delivery_assigned_to?: string;
//             delivery_notes?: string;
//         }
//     ) => {
//         deliveryMutation.mutate(payload);
//     };

//     return (
//         <div className="p-4 flex-1 flex flex-col overflow-hidden">
//             <div className="grid grid-cols-1 gap-6 flex-1 overflow-auto">
//                 {/* Left: Order details */}
//                 <PaymentForm sale={sale} displayName={displayName} onClose={onClose} />

//                 {/* Right: Delivery tracking */}
//                 <div className="space-y-4">
//                     <div>
//                         <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Delivery Tracking</h4>
//                         <DeliveryTimeline sale={sale} />
//                     </div>

//                     <div className="space-y-3 p-3 rounded-lg border bg-card">
//                         <div>
//                             <Label className="text-xs">Delivery Status</Label>
//                             <Select
//                                 value={apiToDeliveryStatus(sale.delivery_status)}
//                                 onValueChange={(v: DeliveryStatus) => updateSaleDelivery(sale.id, { delivery_status: v })}
//                             >
//                                 <SelectTrigger className="h-9">
//                                     <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="processing">Processing</SelectItem>
//                                     <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
//                                     <SelectItem value="delivered">Delivered</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                         <div>
//                             <Label className="text-xs">Assign Rider</Label>
//                             <Select
//                                 value={sale.delivery_assigned_to || ""}
//                                 onValueChange={(v) => updateSaleDelivery(sale.id, { delivery_assigned_to: v })}
//                             >
//                                 <SelectTrigger className="h-9">
//                                     <SelectValue placeholder="Select rider..." />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {RIDERS.map((r) => (
//                                         <SelectItem key={r} value={r}>
//                                             {r}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                         <div>
//                             <Label className="text-xs">Delivery Notes</Label>
//                             <Textarea
//                                 className="min-h-[60px] text-xs"
//                                 placeholder="Add delivery notes..."
//                                 value={sale.delivery_notes || ""}
//                                 onChange={(e) => updateSaleDelivery(sale.id, { delivery_notes: e.target.value })}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Label } from "@/components/ui/label";
// import { type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
// import DeliveryTimeline from "./delivery-timeline";
// import PaymentForm from "./payment-form";
// import { Textarea } from "../ui/textarea";
// import { apiToDeliveryStatus, SaleStatus, type DeliveryStatus } from "@/types/customer";
// import { toast } from "sonner";

// interface DeliveryFormProps {
//     sale: SaleDto;
//     displayName: string;
//     status: SaleStatus;
//     onClose?: () => void;
// }

// const RIDERS = ["Kevin", "Brian", "James", "David"];

// export default function DeliveryForm({ sale, displayName, status, onClose }: DeliveryFormProps) {
//     const queryClient = useQueryClient();

//     const currentStatus = apiToDeliveryStatus(sale.delivery_status);

//     const [nextStatus, setNextStatus] = useState<DeliveryStatus | null>(null);
//     const [rider, setRider] = useState<string>(sale.delivery_assigned_to || "");
//     const [notes, setNotes] = useState<string>(sale.delivery_notes || "");

//     const deliveryMutation = useMutation({
//         mutationFn: (payload: { delivery_status?: DeliveryStatus; delivery_assigned_to?: string; delivery_notes?: string }) =>
//             updateSaleDeliveryApi(sale.id, {
//                 ...payload,
//             }),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["sales"] });
//             toast.success("Delivery updated");
//         },
//         onError: (err: unknown) => {
//             toast.error(err instanceof Error ? err.message : "Failed to update delivery");
//         },
//     });

//     const handleStatusChange = (value: DeliveryStatus) => {
//         // enforce transition rules

//         if (currentStatus === "processing" && value === "out_for_delivery") {
//             if (status !== "paid") {
//                 toast.error("Order must be paid before sending for delivery");
//                 return;
//             }

//             // require rider selection step
//             setNextStatus(value);
//             return;
//         }

//         if (currentStatus === "out_for_delivery" && value === "delivered") {
//             deliveryMutation.mutate({
//                 delivery_status: value,
//             });
//             return;
//         }

//         toast.error("Invalid delivery transition");
//     };

//     const confirmOutForDelivery = () => {
//         if (!rider) {
//             toast.error("Please assign a rider");
//             return;
//         }

//         deliveryMutation.mutate({
//             delivery_status: "out_for_delivery",
//             delivery_assigned_to: rider,
//             delivery_notes: notes,
//         });

//         setNextStatus(null);
//     };

//     const allowedOptions: DeliveryStatus[] =
//         currentStatus === "processing"
//             ? ["processing", "out_for_delivery"]
//             : currentStatus === "out_for_delivery"
//               ? ["out_for_delivery", "delivered"]
//               : ["delivered"];

//     return (
//         <div className="p-4 flex-1 flex flex-col overflow-hidden">
//             <div className="grid grid-cols-1 gap-6 flex-1 overflow-auto">
//                 {/* Order section */}
//                 <PaymentForm sale={sale} displayName={displayName} onClose={onClose} />

//                 {/* Delivery section */}
//                 <div className="space-y-4">
//                     <div>
//                         <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Delivery Tracking</h4>
//                         <DeliveryTimeline sale={sale} />
//                     </div>

//                     <div className="space-y-3 p-3 rounded-lg border bg-card">
//                         <div>
//                             <Label className="text-xs">Delivery Status</Label>

//                             <Select value={currentStatus} onValueChange={(v: DeliveryStatus) => handleStatusChange(v)}>
//                                 <SelectTrigger className="h-9">
//                                     <SelectValue />
//                                 </SelectTrigger>

//                                 <SelectContent>
//                                     {allowedOptions.includes("processing") && <SelectItem value="processing">Processing</SelectItem>}

//                                     {allowedOptions.includes("out_for_delivery") && (
//                                         <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
//                                     )}

//                                     {allowedOptions.includes("delivered") && <SelectItem value="delivered">Delivered</SelectItem>}
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         {/* Rider + notes only when moving to out_for_delivery */}
//                         {nextStatus === "out_for_delivery" && (
//                             <>
//                                 <div>
//                                     <Label className="text-xs">Assign Rider</Label>

//                                     <Select value={rider} onValueChange={(v) => setRider(v)}>
//                                         <SelectTrigger className="h-9">
//                                             <SelectValue placeholder="Select rider..." />
//                                         </SelectTrigger>

//                                         <SelectContent>
//                                             {RIDERS.map((r) => (
//                                                 <SelectItem key={r} value={r}>
//                                                     {r}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>

//                                 <div>
//                                     <Label className="text-xs">Delivery Notes</Label>

//                                     <Textarea
//                                         className="min-h-[60px] text-xs"
//                                         placeholder="Add delivery notes..."
//                                         value={notes}
//                                         onChange={(e) => setNotes(e.target.value)}
//                                     />
//                                 </div>

//                                 <button
//                                     className="h-9 bg-primary text-primary-foreground rounded-md text-xs font-medium"
//                                     onClick={confirmOutForDelivery}
//                                 >
//                                     Confirm Dispatch
//                                 </button>
//                             </>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { type SaleDto, updateSaleDelivery as updateSaleDeliveryApi } from "@/lib/api";
import DeliveryTimeline from "./delivery-timeline";
import PaymentForm from "./payment-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { apiToDeliveryStatus, DeliveryStatus, SaleStatus } from "@/types/customer";
import { toast } from "sonner";

interface DeliveryFormProps {
    sale: SaleDto;
    status: SaleStatus;
    displayName: string;
    onClose?: () => void;
}

const RIDERS = ["Kevin", "Brian", "James", "David"];

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
                {/* Order details */}
                <PaymentForm sale={sale} status={status} displayName={displayName} onClose={onClose} />

                {/* Delivery section */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Delivery Tracking</h4>
                        <DeliveryTimeline sale={sale} />
                    </div>

                    <div className="space-y-3 p-3 rounded-lg border bg-card">
                        {/* STATUS DISPLAY */}
                        <div className="text-xs text-muted-foreground">
                            Current Status: <span className="font-semibold">{status}</span>
                        </div>

                        {/* PROCESSING ACTION */}
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

                        {/* OUT FOR DELIVERY ACTION */}
                        {sale.delivery_status === "out_for_delivery" && (
                            <button className="h-9 w-full rounded-md bg-green-600 text-white text-xs font-medium" onClick={markDelivered}>
                                Mark Delivered
                            </button>
                        )}

                        {/* COMPLETED */}
                        {sale.delivery_status === "delivered" && <div className="text-xs text-green-600 font-medium">Order completed</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
