import React, { createContext, useContext, useState, useCallback } from "react";
import { Customer, Sale, Payment } from "@/types/customer";
import { initialCustomers, initialSales, initialPayments } from "@/data/customers";

interface StoreContextType {
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    addCustomer: (c: Omit<Customer, "id" | "totalPurchases" | "outstandingBalance" | "lastPurchaseDate">) => Customer;
    updateCustomer: (id: string, c: Partial<Customer>) => void;
    addSale: (s: Omit<Sale, "id" | "status">) => void;
    addPayment: (saleId: string, amount: number) => void;
    getCustomer: (id: string) => Customer | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [sales, setSales] = useState<Sale[]>(initialSales);
    const [payments, setPayments] = useState<Payment[]>(initialPayments);

    const getCustomer = useCallback((id: string) => customers.find(c => c.id === id), [customers]);

    const addCustomer = useCallback((c: Omit<Customer, "id" | "totalPurchases" | "outstandingBalance" | "lastPurchaseDate">) => {
        const newCustomer: Customer = {
            ...c,
            id: `CU-${String(customers.length + 1).padStart(3, "0")}`,
            totalPurchases: 0,
            outstandingBalance: 0,
            lastPurchaseDate: null,
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    }, [customers.length]);

    const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);

    const addSale = useCallback((s: Omit<Sale, "id" | "status">) => {
        const status = s.paid >= s.total ? "paid" : s.paid > 0 ? "partial" : "unpaid";
        const newSale: Sale = {
            ...s,
            id: `SL-${String(sales.length + 1).padStart(3, "0")}`,
            status,
        };
        setSales(prev => [newSale, ...prev]);

        // Update customer stats
        setCustomers(prev => prev.map(c => {
            if (c.id !== s.customerId) return c;
            return {
                ...c,
                totalPurchases: c.totalPurchases + s.total,
                outstandingBalance: c.outstandingBalance + (s.total - s.paid),
                lastPurchaseDate: s.date,
            };
        }));

        if (s.paid > 0) {
            setPayments(prev => [...prev, {
                id: `PY-${String(prev.length + 1).padStart(3, "0")}`,
                saleId: newSale.id,
                date: s.date,
                amount: s.paid,
            }]);
        }
    }, [sales.length]);

    const addPayment = useCallback((saleId: string, amount: number) => {
        setSales(prev => prev.map(s => {
            if (s.id !== saleId) return s;
            const newPaid = s.paid + amount;
            return { ...s, paid: newPaid, status: newPaid >= s.total ? "paid" : "partial" };
        }));

        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            setCustomers(prev => prev.map(c => {
                if (c.id !== sale.customerId) return c;
                return { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) };
            }));
        }

        setPayments(prev => [...prev, {
            id: `PY-${String(prev.length + 1).padStart(3, "0")}`,
            saleId,
            date: new Date().toISOString().slice(0, 10),
            amount,
        }]);
    }, [sales]);

    return (
        <StoreContext.Provider value={{ customers, sales, payments, addCustomer, updateCustomer, addSale, addPayment, getCustomer }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within StoreProvider");
    return ctx;
}
