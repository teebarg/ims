import type { SaleDto } from "@/lib/api";

export default function DeliveryTimeline({ sale }: { sale: SaleDto }) {
    const status = sale.delivery_status;

    const steps = [
        {
            title: "Processing",
            description: "Order prepared",
            completed: status == "DELIVERED",
            active: status === "PROCESSING",
        },
        {
            title: "Out for Delivery",
            description: sale.delivery_assigned_to ? `Rider: ${sale.delivery_assigned_to}` : "Awaiting dispatch",
            completed: status == "DELIVERED",
            active: status === "OUT_FOR_DELIVERY",
        },
        {
            title: "Delivered",
            description: "Order completed",
            completed: status == "DELIVERED",
            active: false,
        },
    ];

    return (
        <div className="space-y-4">
            {steps.map((step, idx) => {
                const isDone = step.completed;
                const isActive = step.active;

                return (
                    <div key={idx} className="flex gap-3">
                        {/* timeline dot */}
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${isDone ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-muted"}`} />

                            {idx < steps.length - 1 && <div className="w-[2px] flex-1 bg-border mt-1" />}
                        </div>
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
