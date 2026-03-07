import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const currency = (number: number): string => {
    return Number(number)?.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
};

export const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-NG", { 
        year: "numeric", 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

        // new Date(sale.created_at).toLocaleTimeString([], {
        //                                             hour: "2-digit",
        //                                             minute: "2-digit",
        //                                         })
};
