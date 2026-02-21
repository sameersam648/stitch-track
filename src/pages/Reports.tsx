import { useServiceEntries } from "@/hooks/useServiceEntries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, IndianRupee, Clock, CheckCircle2, Package } from "lucide-react";

const Reports = () => {
  const { data: entries = [], isLoading } = useServiceEntries();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const stats = [
    { label: "Today's Earnings", value: `₹${todayEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success", isSplit: false },
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary", isSplit: false },
    { label: "Pending Machines", value: pending, icon: Clock, color: "text-warning", isSplit: true },
    { label: "Ready for Pickup", value: repaired, icon: CheckCircle2, color: "text-primary", isSplit: true },
    { label: "Delivered", value: delivered, icon: Package, color: "text-success", isSplit: true },
    { label: "Total Entries", value: entries.length, icon: Package, color: "text-foreground", isSplit: false },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stat.isSplit ? (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Unit 1</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{(stat.value as any).u1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Unit 2</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{(stat.value as any).u2}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value as any}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.filter((e) => e.status === "delivered").length === 0 ? (
            <p className="text-muted-foreground text-sm">No deliveries yet.</p>
          ) : (
            <div className="space-y-3">
              {entries
                .filter((e) => e.status === "delivered")
                .slice(0, 10)
                .map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-mono text-sm font-medium">{entry.service_id}</span>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <span className="text-sm">{entry.customer_name}</span>
                    </div>
                    <span className="font-medium text-success">₹{Number(entry.estimated_cost).toLocaleString("en-IN")}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
