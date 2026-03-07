import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2 } from "lucide-react";
import { DeliveryStatus, deliveryStatusLabels } from "@/types/customer";

const DeliveryBadge = ({ status }: { status: DeliveryStatus }) => {
    const styles: Record<DeliveryStatus, string> = {
        processing: "bg-muted text-muted-foreground",
        out_for_delivery: "bg-warning/15 text-warning-foreground dark:text-warning dark:border-warning/50",
        delivered: "bg-success/15 text-success border-success/30 dark:border-success/50",
    };
    const lowerStatus = status.toLowerCase() as DeliveryStatus;
    return (
        <Badge variant="outline" className={`text-xs font-normal ${styles[lowerStatus]}`}>
            {lowerStatus === "processing" && <Package className="h-3 w-3 mr-1" />}
            {lowerStatus === "out_for_delivery" && <Truck className="h-3 w-3 mr-1" />}
            {lowerStatus === "delivered" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {deliveryStatusLabels[lowerStatus]}
        </Badge>
    );
};

export default DeliveryBadge;
