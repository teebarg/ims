import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const currency = (number: number): string => {
    return Number(number)?.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
};
