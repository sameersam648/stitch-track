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
  Clock,
  Zap,
  Plus,
} from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-600 border-orange-200",
  repaired: "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const statusFilters = ["pending", "repaired", "delivered", "all"] as const;

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useServiceEntries();
  const updateStatus = useUpdateStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

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
    pending: {
      total: entries.filter((e) => e.status === "pending").length,
      u1: entries.filter((e) => e.status === "pending" && e.unit === "unit_1").length,
      u2: entries.filter((e) => e.status === "pending" && e.unit === "unit_2").length,
    },
    repaired: {
      total: entries.filter((e) => e.status === "repaired").length,
      u1: entries.filter((e) => e.status === "repaired" && e.unit === "unit_1").length,
      u2: entries.filter((e) => e.status === "repaired" && e.unit === "unit_2").length,
    },
    delivered: {
      total: entries.filter((e) => e.status === "delivered").length,
      u1: entries.filter((e) => e.status === "delivered" && e.unit === "unit_1").length,
      u2: entries.filter((e) => e.status === "delivered" && e.unit === "unit_2").length,
    },
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage entries and status updates.</p>
          </div>
          <Button
            onClick={() => navigate("/new")}
            className="w-full sm:w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg transition-all active:scale-95 py-6 px-8 text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Entry
          </Button>
        </div>
        <div className="relative w-full lg:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search entries..."
            className="pl-11 h-12 bg-card/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards with Mobile-Specific Grids */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Total Card */}
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white min-h-[80px] md:min-h-[120px]">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10">
            <Zap className="h-10 w-10 md:h-16 md:w-16" />
          </div>
          <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 relative z-10">
            <p className="text-[10px] md:text-sm font-medium text-slate-300 flex items-center gap-1 md:gap-2">
              <Package className="h-3 w-3 md:h-4 md:w-4" /> Total
            </p>
            <p className="text-xl md:text-4xl font-bold mt-1 md:mt-2 tracking-tight">{counts.all}</p>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-orange-400 to-orange-500 text-white min-h-[80px] md:min-h-[120px]">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-20">
            <Clock className="h-10 w-10 md:h-16 md:w-16" />
          </div>
          <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 relative z-10">
            <p className="text-[10px] md:text-sm font-medium text-orange-50 flex items-center gap-1 md:gap-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-white" /> Pending
            </p>
            <div className="flex justify-between items-end mt-2 md:mt-4">
              <div className="flex-1 border-r border-white/20">
                <p className="text-[8px] md:text-[10px] text-orange-100 uppercase font-bold tracking-wider">U1</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.pending.u1}</p>
              </div>
              <div className="flex-1 pl-2 md:pl-4 text-right">
                <p className="text-[8px] md:text-[10px] text-orange-100 uppercase font-bold tracking-wider">U2</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.pending.u2}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repaired Card */}
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[80px] md:min-h-[120px]">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-20">
            <CheckCircle2 className="h-10 w-10 md:h-16 md:w-16" />
          </div>
          <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 relative z-10">
            <p className="text-[10px] md:text-sm font-medium text-blue-50 flex items-center gap-1 md:gap-2">
              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-white" /> Repaired
            </p>
            <div className="flex justify-between items-end mt-2 md:mt-4">
              <div className="flex-1 border-r border-white/20">
                <p className="text-[8px] md:text-[10px] text-blue-100 uppercase font-bold tracking-wider">U1</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.repaired.u1}</p>
              </div>
              <div className="flex-1 pl-2 md:pl-4 text-right">
                <p className="text-[8px] md:text-[10px] text-blue-100 uppercase font-bold tracking-wider">U2</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.repaired.u2}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivered Card */}
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white min-h-[80px] md:min-h-[120px]">
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-20">
            <Package className="h-10 w-10 md:h-16 md:w-16" />
          </div>
          <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 relative z-10">
            <p className="text-[10px] md:text-sm font-medium text-emerald-50 flex items-center gap-1 md:gap-2">
              <Package className="h-3 w-3 md:h-4 md:w-4 text-white" /> Delivered
            </p>
            <div className="flex justify-between items-end mt-2 md:mt-4">
              <div className="flex-1 border-r border-white/20">
                <p className="text-[8px] md:text-[10px] text-emerald-100 uppercase font-bold tracking-wider">U1</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.delivered.u1}</p>
              </div>
              <div className="flex-1 pl-2 md:pl-4 text-right">
                <p className="text-[8px] md:text-[10px] text-emerald-100 uppercase font-bold tracking-wider">U2</p>
                <p className="text-lg md:text-3xl font-bold leading-tight">{counts.delivered.u2}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Content section */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 p-1 bg-muted/40 rounded-xl w-full sm:w-fit mb-1">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 sm:flex-initial px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === s
                  ? "bg-white shadow-md text-primary scale-100 sm:scale-105"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1 opacity-70">({s === 'all' ? counts.all : (counts[s as keyof typeof counts] as any).total})</span>
              </button>
            ))}
          </div>
        </div>

        {/* List Section: Desktop Table / Mobile Cards */}
        <div className="space-y-4 md:space-y-0">
          {filtered.length === 0 ? (
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm p-20 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Package className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">No entries found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Desktop Table View (Hidden on Mobile) */}
              <Card className="hidden md:block border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-[80px] font-bold text-foreground">Photo</TableHead>
                        <TableHead className="font-bold text-foreground">Service ID</TableHead>
                        <TableHead className="font-bold text-foreground">Customer</TableHead>
                        <TableHead className="hidden lg:table-cell font-bold text-foreground whitespace-nowrap">Problem</TableHead>
                        <TableHead className="font-bold text-foreground">Unit</TableHead>
                        <TableHead className="font-bold text-foreground">Status</TableHead>
                        <TableHead className="font-bold text-foreground">Cost</TableHead>
                        <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((entry) => (
                        <TableRow key={entry.id} className="group transition-colors hover:bg-muted/20 border-muted/20">
                          <TableCell>
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden shadow-sm border border-muted ring-offset-background group-hover:ring-2 ring-primary/20 transition-all">
                              {entry.photo_url ? (
                                <img
                                  src={entry.photo_url}
                                  alt="Machine"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-bold tracking-tight text-primary">
                            {entry.service_id}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{entry.customer_name}</div>
                            <a
                              href={`tel:${entry.customer_phone}`}
                              className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 hover:text-primary transition-colors hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {entry.customer_phone}
                            </a>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[240px] text-sm italic text-muted-foreground/80 line-clamp-1">
                            {entry.problem_description || "Regular service"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200">
                              {entry.unit === "unit_2" ? "Unit 2" : "Unit 1"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-bold capitalize shadow-sm border ${statusColors[entry.status]}`}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700">
                            ₹{Number(entry.estimated_cost).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                              {entry.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
                                  onClick={() => handleMarkRepaired(entry)}
                                  disabled={updateStatus.isPending}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Ready
                                </Button>
                              )}
                              {entry.status === "repaired" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md"
                                  onClick={() => handleMarkDelivered(entry)}
                                  disabled={updateStatus.isPending}
                                >
                                  <Package className="h-3.5 w-3.5 mr-1" />
                                  Deliver
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 transition-transform active:scale-95 shadow-sm"
                                onClick={() => generatePDF(entry)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Mobile Card View (Visible on Mobile) */}
              <div className="grid md:hidden grid-cols-1 gap-4">
                {filtered.map((entry) => (
                  <Card key={entry.id} className="border-none shadow-md overflow-hidden bg-card/80 backdrop-blur-sm active:scale-[0.98] transition-transform">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Machine Image / Placeholder */}
                        <div className="w-24 h-32 flex-shrink-0 bg-muted/30">
                          {entry.photo_url ? (
                            <img
                              src={entry.photo_url}
                              alt="Machine"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                              <Package className="h-8 w-8 text-slate-200" />
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs font-bold text-primary">{entry.service_id}</span>
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase ${statusColors[entry.status]}`}>
                              {entry.status}
                            </Badge>
                          </div>

                          <h3 className="font-bold text-lg truncate mb-1">{entry.customer_name}</h3>

                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] uppercase font-bold">
                              {entry.unit === "unit_2" ? "Unit 2" : "Unit 1"}
                            </Badge>
                            <span className="font-bold text-sm">₹{Number(entry.estimated_cost).toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="flex-1 h-10 border-muted-foreground/20 active:bg-muted"
                            >
                              <a href={`tel:${entry.customer_phone}`}>
                                <Phone className="h-4 w-4 mr-2" /> Call
                              </a>
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-10 h-10 border-muted-foreground/20"
                              onClick={() => generatePDF(entry)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Action Strips */}
                      {entry.status === "pending" && (
                        <Button
                          className="w-full h-12 rounded-none bg-blue-600 hover:bg-blue-700 font-bold text-base"
                          onClick={() => handleMarkRepaired(entry)}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="h-5 w-5 mr-2" /> Mark as Repaired
                        </Button>
                      )}
                      {entry.status === "repaired" && (
                        <Button
                          className="w-full h-12 rounded-none bg-emerald-600 hover:bg-emerald-700 font-bold text-base"
                          onClick={() => handleMarkDelivered(entry)}
                          disabled={updateStatus.isPending}
                        >
                          <Package className="h-5 w-5 mr-2" /> Mark as Delivered
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
