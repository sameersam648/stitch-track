import { useState, useMemo } from "react";
import { useServiceEntries } from "@/hooks/useServiceEntries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2,
  IndianRupee,
  Clock,
  CheckCircle2,
  Package,
  Search,
  Calendar,
  Filter,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Printer,
  Phone,
  Coins
} from "lucide-react";

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-600 border-orange-200",
  repaired: "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

// Helper for date bounds
const getDateRange = (preset: string, start?: string, end?: string) => {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };
  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  switch (preset) {
    case "today": {
      return { start: startOfDay(now), end: endOfDay(now) };
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "last_7": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "last_30": {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "custom": {
      return {
        start: start ? startOfDay(new Date(start)) : undefined,
        end: end ? endOfDay(new Date(end)) : undefined,
      };
    }
    case "all":
    default:
      return { start: undefined, end: undefined };
  }
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Reports = () => {
  const { data: entries = [], isLoading } = useServiceEntries();

  // Filter States
  const [datePreset, setDatePreset] = useState<string>("this_month");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handle Reset Filters
  const handleResetFilters = () => {
    setDatePreset("this_month");
    setCustomStart("");
    setCustomEnd("");
    setUnitFilter("all");
    setSearchQuery("");
  };

  // Filtered entries (Only including delivered entries for realized revenue)
  const filteredEntries = useMemo(() => {
    const { start, end } = getDateRange(datePreset, customStart, customEnd);

    return entries.filter((e) => {
      // 1. Only delivered entries generate realized revenue
      if (e.status !== "delivered") {
        return false;
      }

      // 2. Unit Filter
      if (unitFilter !== "all" && e.unit !== unitFilter) {
        return false;
      }

      // 3. Date Filter (using delivery date, fallback to created date)
      const dateStr = e.delivered_at || e.created_at;
      if (start || end) {
        if (!dateStr) {
          return false;
        }
        const d = new Date(dateStr);
        if (start && d < start) return false;
        if (end && d > end) return false;
      }

      // 4. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = e.service_id.toLowerCase().includes(q);
        const matchesName = e.customer_name.toLowerCase().includes(q);
        const matchesPhone = e.customer_phone.includes(q);
        if (!matchesId && !matchesName && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [entries, datePreset, customStart, customEnd, unitFilter, searchQuery]);

  // Derived filtered stats
  const filteredRevenue = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + Number(e.estimated_cost), 0);
  }, [filteredEntries]);

  const totalFilteredJobs = filteredEntries.length;

  const averageTicketValue = useMemo(() => {
    return totalFilteredJobs > 0 ? filteredRevenue / totalFilteredJobs : 0;
  }, [filteredRevenue, totalFilteredJobs]);

  const unitStats = useMemo(() => {
    const u1Entries = filteredEntries.filter((e) => e.unit === "unit_1");
    const u2Entries = filteredEntries.filter((e) => e.unit === "unit_2");
    const u1Rev = u1Entries.reduce((sum, e) => sum + Number(e.estimated_cost), 0);
    const u2Rev = u2Entries.reduce((sum, e) => sum + Number(e.estimated_cost), 0);
    const u1Count = u1Entries.length;
    const u2Count = u2Entries.length;

    const total = u1Rev + u2Rev;
    const u1Pct = total > 0 ? (u1Rev / total) * 100 : 0;
    const u2Pct = total > 0 ? (u2Rev / total) * 100 : 0;

    return {
      u1: { revenue: u1Rev, count: u1Count, percentage: u1Pct },
      u2: { revenue: u2Rev, count: u2Count, percentage: u2Pct },
    };
  }, [filteredEntries]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Keep original dashboard-wide static stats for overview
  const today = new Date().toDateString();
  const todayEntries = entries.filter((e) => new Date(e.created_at).toDateString() === today);

  const totalRevenue = entries
    .filter((e) => e.status === "delivered")
    .reduce((sum, e) => sum + Number(e.estimated_cost), 0);

  const todayEarnings = todayEntries
    .filter((e) => e.status === "delivered")
    .reduce((sum, e) => sum + Number(e.estimated_cost), 0);

  const pending = {
    u1: entries.filter((e) => e.status === "pending" && e.unit === "unit_1").length,
    u2: entries.filter((e) => e.status === "pending" && e.unit === "unit_2").length,
  };
  const repaired = {
    u1: entries.filter((e) => e.status === "repaired" && e.unit === "unit_1").length,
    u2: entries.filter((e) => e.status === "repaired" && e.unit === "unit_2").length,
  };
  const delivered = {
    u1: entries.filter((e) => e.status === "delivered" && e.unit === "unit_1").length,
    u2: entries.filter((e) => e.status === "delivered" && e.unit === "unit_2").length,
  };

  const overviewStats = [
    { label: "Today's Earnings", value: `₹${todayEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-500 border-emerald-100", isSplit: false },
    { label: "Total Revenue (All Time)", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary border-primary/20", isSplit: false },
    { label: "Pending Machines", value: pending, icon: Clock, color: "text-amber-500 border-amber-100", isSplit: true },
    { label: "Ready for Pickup", value: repaired, icon: CheckCircle2, color: "text-blue-500 border-blue-100", isSplit: true },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 print:space-y-4 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Overview of business performance and custom revenue calculations.</p>
        </div>
      </div>

      {/* Overview Cards (Static Global Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {overviewStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color.split(" ")[0]}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stat.isSplit ? (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Unit 1</p>
                    <p className={`text-xl font-bold ${stat.color.split(" ")[0]}`}>{(stat.value as { u1: number; u2: number }).u1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Unit 2</p>
                    <p className={`text-xl font-bold ${stat.color.split(" ")[0]}`}>{(stat.value as { u1: number; u2: number }).u2}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-xl md:text-2xl font-bold ${stat.color.split(" ")[0]}`}>{stat.value as string}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Calculator Section */}
      <Card className="border-none shadow-xl bg-card/70 backdrop-blur-md overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <CardHeader className="border-b bg-muted/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Interactive Revenue Calculator
            </CardTitle>
            <CardDescription className="print:hidden">Filter service entries dynamically to compute targeted revenue breakdown.</CardDescription>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-semibold h-9 px-3 active:scale-95 transition-transform"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 h-9 px-3 active:scale-95 transition-transform"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Filters controls - Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl border border-muted/50 print:hidden">
            {/* Date Preset */}
            <div className="space-y-1.5">
              <Label htmlFor="datePreset" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date Period</Label>
              <select
                id="datePreset"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7">Last 7 Days</option>
                <option value="last_30">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Unit Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="unitFilter" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workplace Unit</Label>
              <select
                id="unitFilter"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="all">All Units</option>
                <option value="unit_1">Unit 1</option>
                <option value="unit_2">Unit 2</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Picker Container */}
          {datePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-top-2 duration-300 print:hidden">
              <div className="space-y-1.5">
                <Label htmlFor="customStart" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Start Date
                </Label>
                <Input
                  id="customStart"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-card h-10 text-sm font-medium shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customEnd" className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> End Date
                </Label>
                <Input
                  id="customEnd"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-card h-10 text-sm font-medium shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Printable Report Header */}
          <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-800">REVENUE REPORT</h2>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <p><span className="font-bold">Period:</span> {datePreset === "custom" ? `${customStart || "Start"} to ${customEnd || "End"}` : datePreset.toUpperCase()}</p>
              <p><span className="font-bold">Unit:</span> {unitFilter.toUpperCase()}</p>
              <p><span className="font-bold">Status:</span> DELIVERED (Revenue Realized)</p>
            </div>
          </div>

          {/* Calculator Results Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtered Revenue Card */}
            <Card className="relative overflow-hidden border border-success/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <IndianRupee className="h-16 w-16 text-emerald-600" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Realized Revenue
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-emerald-600 mt-2 tracking-tight">
                  ₹{filteredRevenue.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">Computed from filtered matches.</p>
              </CardContent>
            </Card>

            {/* Match Jobs Count Card */}
            <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Package className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Filter className="h-4 w-4" /> Jobs Count
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-primary mt-2 tracking-tight">
                  {totalFilteredJobs}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">Matched sewing machines.</p>
              </CardContent>
            </Card>

            {/* Average Revenue Card */}
            <Card className="relative overflow-hidden border border-slate-200 bg-slate-50/50 dark:bg-slate-900/10 shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins className="h-16 w-16 text-slate-500" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="h-4 w-4" /> Avg Ticket Size
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-slate-700 dark:text-slate-200 mt-2 tracking-tight">
                  ₹{Math.round(averageTicketValue).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">Average revenue per machine.</p>
              </CardContent>
            </Card>
          </div>

          {/* Unit Share Distribution Progress Bar */}
          <div className="p-5 border border-muted/50 rounded-xl bg-muted/20 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Workplace Share Distribution</h3>
                <p className="text-xs text-muted-foreground">Revenue partition between Unit 1 and Unit 2.</p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-1 bg-slate-100 rounded-md">
                Ratio: {unitStats.u1.count} vs {unitStats.u2.count} Jobs
              </span>
            </div>

            {/* Custom Dual Segments Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${unitStats.u1.percentage}%` }}
                className="bg-primary h-full transition-all duration-500"
                title={`Unit 1: ${unitStats.u1.percentage.toFixed(1)}%`}
              />
              <div
                style={{ width: `${unitStats.u2.percentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Unit 2: ${unitStats.u2.percentage.toFixed(1)}%`}
              />
            </div>

            {/* Legend Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium mt-1">
              <div className="flex items-center gap-2 justify-between p-2.5 rounded-lg bg-card shadow-sm border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary" />
                  <span className="font-bold text-primary">Unit 1</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-100">₹{unitStats.u1.revenue.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground text-[10px] ml-1.5 font-bold uppercase tracking-wider">({unitStats.u1.percentage.toFixed(0)}% • {unitStats.u1.count} jobs)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between p-2.5 rounded-lg bg-card shadow-sm border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-600">Unit 2</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-100">₹{unitStats.u2.revenue.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground text-[10px] ml-1.5 font-bold uppercase tracking-wider">({unitStats.u2.percentage.toFixed(0)}% • {unitStats.u2.count} jobs)</span>
                </div>
              </div>
            </div>
          </div>

          {/* List of matching entries table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-6 print:hidden">
              <h3 className="text-base font-bold flex items-center gap-2">
                Matched Entries ({filteredEntries.length})
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search matched name, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto opacity-35 mb-2" />
                <p className="text-sm font-semibold">No jobs match your filter criteria.</p>
                <p className="text-xs">Adjust your preset period or filters above.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold">Service ID</TableHead>
                        <TableHead className="font-bold">Date (Delivered)</TableHead>
                        <TableHead className="font-bold">Customer</TableHead>
                        <TableHead className="font-bold">Brand</TableHead>
                        <TableHead className="font-bold">Unit</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((e) => (
                        <TableRow key={e.id} className="hover:bg-muted/10">
                          <TableCell className="font-mono font-bold text-primary text-xs">{e.service_id}</TableCell>
                          <TableCell className="text-xs font-semibold">
                            {formatDate(e.delivered_at || e.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-xs">{e.customer_name}</div>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-2.5 w-2.5" /> {e.customer_phone}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.machine_brand || "Regular Service"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold bg-slate-50">
                              {e.unit === "unit_2" ? "Unit 2" : "Unit 1"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[9px] uppercase font-bold ${statusColors[e.status]}`}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-right text-xs">
                            ₹{Number(e.estimated_cost).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View List */}
                <div className="grid grid-cols-1 gap-3 md:hidden print:hidden">
                  {filteredEntries.map((e) => (
                    <div key={e.id} className="p-4 border rounded-xl bg-card/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-primary text-xs">{e.service_id}</span>
                        <span className="font-bold text-sm">₹{Number(e.estimated_cost).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="font-bold text-sm">{e.customer_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.machine_brand || "Regular Service"}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(e.delivered_at || e.created_at)}
                          </p>
                          <div className="flex gap-1.5 justify-end">
                            <Badge variant="outline" className="text-[8px] uppercase font-bold">
                              {e.unit === "unit_2" ? "U2" : "U1"}
                            </Badge>
                            <Badge variant="outline" className={`text-[8px] uppercase font-bold ${statusColors[e.status]}`}>
                              {e.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
