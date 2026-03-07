// import { apiToDeliveryStatus, type DeliveryStatus } from "@/types/customer";
// import type { SaleDto } from "@/lib/api";

// const DeliveryTimeline = ({ sale }: { sale: SaleDto }) => {
//     const status: DeliveryStatus = apiToDeliveryStatus(sale.delivery_status);
//     const steps = [
//         { label: "Order Created", date: sale.sale_date, done: true },
//         {
//             label: "Out for Delivery",
//             date: sale.out_for_delivery_at?.slice(0, 10) ?? undefined,
//             done: status === "out_for_delivery" || status === "delivered",
//         },
//         {
//             label: "Delivered",
//             date: sale.delivered_at?.slice(0, 10) ?? undefined,
//             done: status === "delivered",
//         },
//     ];
//     return (
//         <div className="flex flex-col gap-0">
//             {steps.map((s, i) => (
//                 <div key={i} className="flex items-start gap-3">
//                     <div className="flex flex-col items-center">
//                         <div
//                             className={`h-3 w-3 rounded-full border-2 ${s.done ? "bg-success border-success" : "bg-background border-muted-foreground/30"}`}
//                         />
//                         {i < steps.length - 1 && <div className={`w-0.5 h-6 ${s.done ? "bg-success" : "bg-muted"}`} />}
//                     </div>
//                     <div className="-mt-0.5">
//                         <p className={`text-xs font-medium ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
//                         {s.date && <p className="text-[10px] text-muted-foreground">{s.date}</p>}
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// };

// export default DeliveryTimeline;

import { apiToDeliveryStatus } from "@/types/customer";
import type { SaleDto } from "@/lib/api";

export default function DeliveryTimeline({ sale }: { sale: SaleDto }) {
    const status = apiToDeliveryStatus(sale.delivery_status);

    const steps = [
        {
            key: "processing",
            title: "Processing",
            description: "Order prepared",
            completed: status !== "processing",
            active: status === "processing",
        },
        {
            key: "out_for_delivery",
            title: "Out for Delivery",
            description: sale.delivery_assigned_to ? `Rider: ${sale.delivery_assigned_to}` : "Awaiting dispatch",
            completed: status === "delivered",
            active: status === "out_for_delivery",
        },
        {
            key: "delivered",
            title: "Delivered",
            description: "Order completed",
            completed: status === "delivered",
            active: false,
        },
    ];

    return (
        <div className="space-y-4">
            {steps.map((step, i) => {
                const isDone = step.completed;
                const isActive = step.active;

                return (
                    <div key={step.key} className="flex gap-3">
                        {/* timeline dot */}
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${isDone ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-muted"}`} />

                            {i < steps.length - 1 && <div className="w-[2px] flex-1 bg-border mt-1" />}
                        </div>

                        {/* content */}
                        <div className="pb-4">
                            <div className="text-xs font-medium">{step.title}</div>

                            <div className="text-xs text-muted-foreground">{step.description}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
