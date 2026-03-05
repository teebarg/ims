import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import BalesPage from "@/pages/BalesPage";
import SalesPage from "@/pages/SalesPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerProfilePage from "@/pages/CustomerProfilePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AuthPage from "@/pages/AuthPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                {/* <AuthProvider> */}
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <StoreProvider>
                                    <DashboardLayout>
                                        <Routes>
                                            <Route path="/" element={<DashboardPage />} />
                                            <Route path="/bales" element={<BalesPage />} />
                                            <Route path="/customers" element={<CustomersPage />} />
                                            <Route path="/customers/:id" element={<CustomerProfilePage />} />
                                            <Route path="/sales" element={<SalesPage />} />
                                            <Route path="/analytics" element={<AnalyticsPage />} />
                                            <Route path="/admin/users" element={<UserManagementPage />} />
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </DashboardLayout>
                                </StoreProvider>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                {/* </AuthProvider> */}
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
