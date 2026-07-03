import { useState, useEffect, useRef, useMemo } from "react";
import { useServiceEntries, useUpdateStatus } from "@/hooks/useServiceEntries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Search,
  AlertTriangle,
  CheckCircle2,
  User,
  Cpu,
  Phone,
  IndianRupee,
  Camera,
  Loader2,
  RefreshCw,
  Clock,
  Package
} from "lucide-react";

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-600 border-orange-200",
  repaired: "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const ScanDelivery = () => {
  const { data: entries = [], isLoading: loadingEntries } = useServiceEntries();
  const updateStatus = useUpdateStatus();
  const { toast } = useToast();

  // Scan & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  
  // Camera scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Form State
  const [repairCost, setRepairCost] = useState<string>("");

  // Start the QR camera scanner
  const startScanner = async () => {
    setCameraError("");
    setCameraActive(false);
    
    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping existing scanner", err);
      }
      scannerRef.current = null;
    }

    try {
      const html5Qrcode = new Html5Qrcode("reader");
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          // Scanned successfully!
          toast({ title: "✓ QR Scanned", description: `Service ID: ${decodedText}` });
          setSelectedServiceId(decodedText);
          
          // Stop scanner to save resources
          void stopScanner();
        },
        () => {
          // Verbose error logging ignored to prevent console spam
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setCameraError(
        "Could not access camera. Please verify camera permissions are granted. Note: Camera scanning requires a secure connection (HTTPS or Localhost)."
      );
      setCameraActive(false);
    }
  };

  // Stop the QR camera scanner
  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
    setCameraActive(false);
  };

  // Auto-start scanner on mount
  useEffect(() => {
    void startScanner();
    return () => {
      if (scannerRef.current) {
        void stopScanner();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find entry details
  const matchedEntry = useMemo(() => {
    if (!selectedServiceId) return null;
    return entries.find((e) => e.service_id.toUpperCase().trim() === selectedServiceId.toUpperCase().trim()) || null;
  }, [entries, selectedServiceId]);

  // Set default cost value when matchedEntry is found
  useEffect(() => {
    if (matchedEntry) {
      setRepairCost(String(matchedEntry.estimated_cost));
    } else {
      setRepairCost("");
    }
  }, [matchedEntry]);

  // Manual Search Handler
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSelectedServiceId(searchQuery.trim());
    void stopScanner();
  };

  // Deliver Handler
  const handleCompleteDelivery = async () => {
    if (!matchedEntry) return;

    const costNum = parseFloat(repairCost);
    if (isNaN(costNum) || costNum < 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid cost amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: matchedEntry.id,
        status: "delivered",
        estimated_cost: costNum,
      });
      toast({
        title: "Delivery Completed!",
        description: `Sewing machine ${matchedEntry.service_id} successfully delivered.`,
      });
    } catch (err) {
      console.error("Delivery failed", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">QR Scan & Deliver</h1>
        <p className="text-muted-foreground mt-1 text-sm">Scan customer receipt QR code to verify details and complete delivery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Camera Verification Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Viewfinder Wrapper */}
            <div className="w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-2xl bg-black border-2 border-muted relative shadow-inner flex flex-col items-center justify-center">
              {/* Scan overlays (pulsing border and laser animation) */}
              {cameraActive && (
                <>
                  <div className="absolute inset-0 border-[3px] border-primary/20 pointer-events-none rounded-2xl z-10" />
                  {/* Pulsing targeting frames */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg z-10 animate-pulse" />
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg z-10 animate-pulse" />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg z-10 animate-pulse" />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-lg z-10 animate-pulse" />
                  
                  {/* Scanner line laser */}
                  <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)] z-10 animate-[bounce_3s_infinite]" />
                </>
              )}

              {/* QR Scanner Div */}
              <div id="reader" className="w-full h-full" />

              {/* Status overlays if camera is stopped / error */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center space-y-3">
                  {cameraError ? (
                    <>
                      <AlertTriangle className="h-10 w-10 text-rose-500" />
                      <p className="text-xs font-semibold px-2">{cameraError}</p>
                      <Button
                        size="sm"
                        onClick={startScanner}
                        className="bg-primary hover:bg-primary/90 font-bold active:scale-95 transition-transform"
                      >
                        <Camera className="h-4 w-4 mr-2" /> Retry Camera
                      </Button>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      <p className="text-sm font-semibold">Verification QR Code Scanned</p>
                      <Button
                        size="sm"
                        onClick={startScanner}
                        className="bg-primary hover:bg-primary/90 font-bold active:scale-95 transition-transform"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Scan Again
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Manual Lookup */}
            <div className="border-t pt-4">
              <form onSubmit={handleManualSearch} className="space-y-3">
                <Label htmlFor="manualSearch" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Manual Service ID Lookup
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="manualSearch"
                    placeholder="Enter Service ID (e.g. SM-0001)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="font-mono text-sm h-10 shadow-sm"
                  />
                  <Button
                    type="submit"
                    className="h-10 active:scale-95 transition-transform"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Verification & Details Panel */}
        <div className="space-y-6">
          {!selectedServiceId ? (
            <Card className="border-none shadow-md bg-card/40 p-12 text-center h-full flex flex-col justify-center items-center">
              <QrCode className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-bold text-foreground">Waiting for Scan</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                Scan the bill QR code or search manually to load customer and sewing machine details.
              </p>
            </Card>
          ) : loadingEntries ? (
            <Card className="border-none shadow-md bg-card/40 p-12 text-center h-full flex flex-col justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Fetching sewing machine records...</p>
            </Card>
          ) : !matchedEntry ? (
            <Card className="border-none shadow-md border-destructive/20 bg-destructive/5 p-10 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
              <div>
                <h3 className="font-bold text-rose-600">Service Record Not Found</h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] mx-auto">
                  Service ID &quot;{selectedServiceId}&quot; does not match any entry in the database. Please check the spelling and try again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedServiceId(null)}
                className="mx-auto"
              >
                Clear Search
              </Button>
            </Card>
          ) : (
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-primary font-mono">{matchedEntry.service_id}</CardTitle>
                  <CardDescription className="text-xs">Receipt Verification Details</CardDescription>
                </div>
                <Badge variant="outline" className={`font-bold capitalize ${statusColors[matchedEntry.status]}`}>
                  {matchedEntry.status}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                {/* Status-specific warnings */}
                {matchedEntry.status === "pending" && (
                  <div className="flex gap-2.5 p-3 rounded-lg border border-orange-200 bg-orange-500/5 text-orange-600 text-xs font-medium">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Pending Machine Status</p>
                      <p className="text-muted-foreground mt-0.5">This sewing machine has not been marked as Repaired yet. Please confirm repair is finished.</p>
                    </div>
                  </div>
                )}

                {matchedEntry.status === "delivered" && (
                  <div className="flex gap-2.5 p-3 rounded-lg border border-emerald-200 bg-emerald-500/5 text-emerald-600 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Machine Already Delivered</p>
                      <p className="text-muted-foreground mt-0.5">
                        This job was completed and delivered on {formatDate(matchedEntry.delivered_at || matchedEntry.updated_at)} for ₹{Number(matchedEntry.estimated_cost).toLocaleString("en-IN")}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Machine Info Fields */}
                <div className="space-y-3.5 text-sm">
                  {/* Customer Name */}
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Customer Name</p>
                      <p className="font-bold text-slate-800">{matchedEntry.customer_name}</p>
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Phone Number</p>
                      <p className="font-bold text-slate-800">{matchedEntry.customer_phone}</p>
                    </div>
                  </div>

                  {/* Brand & Unit */}
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Cpu className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sewing Machine Brand / Model</p>
                      <p className="font-bold text-slate-800">{matchedEntry.machine_brand || "General Sewing Machine"}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px] h-fit uppercase mt-2">
                      {matchedEntry.unit === "unit_2" ? "Unit 2" : "Unit 1"}
                    </Badge>
                  </div>

                  {/* Problem Description */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Problem Details</p>
                    <p className="text-xs italic text-slate-600">{matchedEntry.problem_description || "Regular General Servicing"}</p>
                  </div>
                </div>

                {/* Delivery Form (Active if not delivered) */}
                {matchedEntry.status !== "delivered" && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="finalCost" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5 text-primary" /> Repair & Delivery Cost (₹) *
                      </Label>
                      <Input
                        id="finalCost"
                        type="number"
                        min="0"
                        value={repairCost}
                        onChange={(e) => setRepairCost(e.target.value)}
                        className="text-base font-bold shadow-sm h-11"
                        placeholder="0.00"
                      />
                    </div>

                    <Button
                      onClick={handleCompleteDelivery}
                      disabled={updateStatus.isPending}
                      className="w-full h-11 text-base font-bold bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-95 transition-all text-white shadow-md flex items-center justify-center"
                    >
                      {updateStatus.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving Delivery...
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5 mr-2" /> Complete Delivery & Save
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Close verification panel button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedServiceId(null)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Entry View
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple date formatter helper
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default ScanDelivery;
