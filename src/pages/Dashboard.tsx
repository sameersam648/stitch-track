import { useState } from "react";
import { useServiceEntries, useUpdateStatus, type ServiceEntry } from "@/hooks/useServiceEntries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  CheckCircle2,
  Package,
  Loader2,
  Phone,
  FileText,
} from "lucide-react";
import { generatePDF } from "@/lib/pdf";

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  repaired: "bg-primary/15 text-primary border-primary/30",
  delivered: "bg-success/15 text-success border-success/30",
};

const statusFilters = ["all", "pending", "repaired", "delivered"] as const;

const Dashboard = () => {
  const { data: entries = [], isLoading } = useServiceEntries();
  const updateStatus = useUpdateStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.service_id.toLowerCase().includes(search.toLowerCase()) ||
      e.customer_phone.includes(search) ||
      e.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    repaired: entries.filter((e) => e.status === "repaired").length,
    delivered: entries.filter((e) => e.status === "delivered").length,
  };

  const handleMarkRepaired = (entry: ServiceEntry) => {
    updateStatus.mutate({ id: entry.id, status: "repaired" });
    const message = encodeURIComponent(
      `Hello ${entry.customer_name}, your sewing machine (Service ID: ${entry.service_id}) is ready for pickup.`
    );
    window.open(`https://wa.me/91${entry.customer_phone}?text=${message}`, "_blank");
  };

  const handleMarkDelivered = (entry: ServiceEntry) => {
    updateStatus.mutate({ id: entry.id, status: "delivered" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name or phone..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{counts.all}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-warning">Pending</p>
            <p className="text-2xl font-bold">{counts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-primary">Repaired</p>
            <p className="text-2xl font-bold">{counts.repaired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-success">Delivered</p>
            <p className="text-2xl font-bold">{counts.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Service ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Problem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No service entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.photo_url ? (
                        <img
                          src={entry.photo_url}
                          alt="Machine"
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">{entry.service_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.customer_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.customer_phone}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                      {entry.problem_description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[entry.status]}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      <div>₹{entry.estimated_cost}</div>
                      {Number(entry.advance_paid) > 0 && (
                        <div className="text-xs text-success">Adv: ₹{entry.advance_paid}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {entry.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleMarkRepaired(entry)}
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Repaired
                          </Button>
                        )}
                        {entry.status === "repaired" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleMarkDelivered(entry)}
                            disabled={updateStatus.isPending}
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Delivered
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => generatePDF(entry)}
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
