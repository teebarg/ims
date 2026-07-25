import { type SaleDto } from "@/lib/api";
import MobileSaleCard from "../sales/mobile-sale-card";
import CustomerDebtReminder from "../sales/debt-reminder";

export default function CustomerSalesDetails({ sales, customer }: { sales: SaleDto[]; customer: any }) {
    return (
        <div className="lg:col-span-2">
            <h2 className="text-sm font-heading">Sales History</h2>
            <CustomerDebtReminder sales={sales} customerName={customer?.display_name} customerPhone={customer?.phone} />
            <div className="space-y-2.5 mt-2 max-h-[50vh] overflow-auto">
                {sales.map((s) => {
                    return <MobileSaleCard key={s.id} sale={s} c_display_name={customer?.display_name} c_identifier={customer?.identifier} />;
                })}
            </div>
        </div>
    );
}
