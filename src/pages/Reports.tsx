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

  const totalAdvance = entries.reduce((sum, e) => sum + Number(e.advance_paid), 0);

  const pending = entries.filter((e) => e.status === "pending").length;
  const repaired = entries.filter((e) => e.status === "repaired").length;
  const delivered = entries.filter((e) => e.status === "delivered").length;

  const pendingRevenue = entries
    .filter((e) => e.status !== "delivered")
    .reduce((sum, e) => sum + (Number(e.estimated_cost) - Number(e.advance_paid)), 0);

  const stats = [
    { label: "Today's Earnings", value: `₹${todayEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success" },
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary" },
    { label: "Advance Collected", value: `₹${totalAdvance.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-accent" },
    { label: "Pending Collection", value: `₹${pendingRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-warning" },
    { label: "Pending Machines", value: pending, icon: Clock, color: "text-warning" },
    { label: "Ready for Pickup", value: repaired, icon: CheckCircle2, color: "text-primary" },
    { label: "Delivered", value: delivered, icon: Package, color: "text-success" },
    { label: "Total Entries", value: entries.length, icon: Package, color: "text-foreground" },
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
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
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
