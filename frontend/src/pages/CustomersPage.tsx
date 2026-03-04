import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Search, Users, DollarSign, AlertCircle } from "lucide-react";
import { identifierTypeLabels, type IdentifierType } from "@/types/customer";

export default function CustomersPage() {
  const { customers, addCustomer } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", identifierType: "instagram" as IdentifierType, identifier: "", phone: "" });
  const [error, setError] = useState("");

  const filtered = customers.filter(c => {
    const matchSearch = c.displayName.toLowerCase().includes(search.toLowerCase()) || c.identifier.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.identifierType === filterType;
    return matchSearch && matchType;
  });

  const totalOutstanding = customers.reduce((a, c) => a + c.outstandingBalance, 0);
  const totalCustomers = customers.length;
  const withBalance = customers.filter(c => c.outstandingBalance > 0).length;

  const handleAdd = () => {
    setError("");
    if (!form.displayName.trim() || !form.identifier.trim()) {
      setError("Name and identifier are required.");
      return;
    }
    const exists = customers.some(c => c.identifier.toLowerCase() === form.identifier.toLowerCase());
    if (exists) {
      setError("This identifier is already taken.");
      return;
    }
    addCustomer({ displayName: form.displayName.trim(), identifierType: form.identifierType, identifier: form.identifier.trim(), phone: form.phone.trim() || undefined });
    setForm({ displayName: "", identifierType: "instagram", identifier: "", phone: "" });
    setModalOpen(false);
  };

  const typeIcon = (type: IdentifierType) => {
    const colors: Record<IdentifierType, string> = {
      tiktok: "bg-foreground/10 text-foreground",
      instagram: "bg-primary/10 text-primary",
      street: "bg-warning/20 text-warning",
      app: "bg-success/20 text-success",
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Customers</h1>
          <p className="page-subtitle">Manage your customer base and track balances</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Display Name</Label>
                <Input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="e.g. Sarah Kimani" />
              </div>
              <div>
                <Label>Identifier Type</Label>
                <Select value={form.identifierType} onValueChange={(v: IdentifierType) => setForm(p => ({ ...p, identifierType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(identifierTypeLabels) as [IdentifierType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Identifier</Label>
                <Input value={form.identifier} onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))} placeholder={form.identifierType === "tiktok" || form.identifierType === "instagram" ? "@handle" : "Nickname or username"} />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+254..." />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Save Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="metric-label">Total Customers</p>
              <p className="metric-value text-xl">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="metric-label">With Balance</p>
              <p className="metric-value text-xl text-destructive">{withBalance}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="metric-label">Total Outstanding</p>
              <p className="metric-value text-xl text-destructive">${totalOutstanding}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or handle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(identifierTypeLabels) as [IdentifierType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Identifier</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Total Purchases</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Outstanding</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td className="p-3 font-medium">{c.displayName}</td>
                    <td className="p-3 font-mono text-xs">{c.identifier}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${typeIcon(c.identifierType)}`}>
                        {identifierTypeLabels[c.identifierType]}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">${c.totalPurchases}</td>
                    <td className="p-3">
                      {c.outstandingBalance > 0
                        ? <span className="font-semibold text-destructive">${c.outstandingBalance}</span>
                        : <span className="text-success font-medium">$0</span>
                      }
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{c.lastPurchaseDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/customers/${c.id}`)}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.displayName}</span>
                <Badge variant="outline" className={`text-xs ${typeIcon(c.identifierType)}`}>
                  {identifierTypeLabels[c.identifierType]}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-muted-foreground">{c.identifier}</span>
                <div className="text-right">
                  <p className="font-heading font-bold">${c.totalPurchases}</p>
                  {c.outstandingBalance > 0 && <p className="text-xs text-destructive font-semibold">Bal: ${c.outstandingBalance}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
