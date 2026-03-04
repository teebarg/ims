import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Package, Search } from "lucide-react";

interface Bale {
  id: string;
  purchaseDate: string;
  totalItems: number;
  remainingItems: number;
  totalCost: number;
  category: string;
  shirts: number;
  pants: number;
  jackets: number;
  others: number;
}

const initialBales: Bale[] = [
  { id: "BL-001", purchaseDate: "2026-02-20", totalItems: 120, remainingItems: 85, totalCost: 480, category: "Mixed", shirts: 50, pants: 35, jackets: 20, others: 15 },
  { id: "BL-002", purchaseDate: "2026-02-15", totalItems: 80, remainingItems: 22, totalCost: 320, category: "Mixed", shirts: 30, pants: 25, jackets: 15, others: 10 },
  { id: "BL-003", purchaseDate: "2026-03-01", totalItems: 200, remainingItems: 195, totalCost: 750, category: "Mixed", shirts: 80, pants: 60, jackets: 30, others: 30 },
  { id: "BL-004", purchaseDate: "2026-01-28", totalItems: 60, remainingItems: 0, totalCost: 240, category: "Shirts", shirts: 60, pants: 0, jackets: 0, others: 0 },
];

export default function BalesPage() {
  const [bales, setBales] = useState<Bale[]>(initialBales);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newBale, setNewBale] = useState({
    totalItems: "", totalCost: "", shirts: "", pants: "", jackets: "", others: "", purchaseDate: ""
  });

  const filteredBales = bales.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddBale = () => {
    const total = Number(newBale.totalItems);
    const bale: Bale = {
      id: `BL-${String(bales.length + 1).padStart(3, "0")}`,
      purchaseDate: newBale.purchaseDate || new Date().toISOString().slice(0, 10),
      totalItems: total,
      remainingItems: total,
      totalCost: Number(newBale.totalCost),
      category: "Mixed",
      shirts: Number(newBale.shirts) || 0,
      pants: Number(newBale.pants) || 0,
      jackets: Number(newBale.jackets) || 0,
      others: Number(newBale.others) || 0,
    };
    setBales([bale, ...bales]);
    setNewBale({ totalItems: "", totalCost: "", shirts: "", pants: "", jackets: "", others: "", purchaseDate: "" });
    setOpen(false);
  };

  const stockPercent = (b: Bale) => Math.round((b.remainingItems / b.totalItems) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Bale Management</h1>
          <p className="page-subtitle">Track and manage your clothing bales</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Bale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Bale</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total Items</Label>
                  <Input type="number" value={newBale.totalItems} onChange={e => setNewBale(p => ({ ...p, totalItems: e.target.value }))} />
                </div>
                <div>
                  <Label>Total Cost ($)</Label>
                  <Input type="number" value={newBale.totalCost} onChange={e => setNewBale(p => ({ ...p, totalCost: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={newBale.purchaseDate} onChange={e => setNewBale(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Category Distribution</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Shirts</Label>
                    <Input type="number" value={newBale.shirts} onChange={e => setNewBale(p => ({ ...p, shirts: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Pants</Label>
                    <Input type="number" value={newBale.pants} onChange={e => setNewBale(p => ({ ...p, pants: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Jackets</Label>
                    <Input type="number" value={newBale.jackets} onChange={e => setNewBale(p => ({ ...p, jackets: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Others</Label>
                    <Input type="number" value={newBale.others} onChange={e => setNewBale(p => ({ ...p, others: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAddBale}>Add Bale</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bales..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-4">
        {/* Mobile cards + Desktop table */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Bale ID</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Remaining</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Cost</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Distribution</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBales.map(bale => (
                      <tr key={bale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs font-medium">{bale.id}</td>
                        <td className="p-3">{bale.purchaseDate}</td>
                        <td className="p-3">{bale.totalItems}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{bale.remainingItems}</span>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${stockPercent(bale)}%`,
                                  backgroundColor: stockPercent(bale) > 30 ? 'hsl(152, 60%, 40%)' : stockPercent(bale) > 0 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">${bale.totalCost}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          S:{bale.shirts} P:{bale.pants} J:{bale.jackets} O:{bale.others}
                        </td>
                        <td className="p-3">
                          <Badge variant={bale.remainingItems === 0 ? "destructive" : bale.remainingItems < 20 ? "secondary" : "default"} className="text-xs font-normal">
                            {bale.remainingItems === 0 ? "Sold Out" : bale.remainingItems < 20 ? "Low" : "In Stock"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredBales.map(bale => (
            <Card key={bale.id} className="animate-slide-in">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-medium">{bale.id}</span>
                  </div>
                  <Badge variant={bale.remainingItems === 0 ? "destructive" : bale.remainingItems < 20 ? "secondary" : "default"} className="text-xs">
                    {bale.remainingItems === 0 ? "Sold Out" : bale.remainingItems < 20 ? "Low" : "In Stock"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{bale.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-medium">{bale.remainingItems}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-medium">${bale.totalCost}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stockPercent(bale)}%`,
                      backgroundColor: stockPercent(bale) > 30 ? 'hsl(152, 60%, 40%)' : stockPercent(bale) > 0 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
