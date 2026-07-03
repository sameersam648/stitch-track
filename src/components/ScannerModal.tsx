import { useState, useEffect, useRef, useMemo } from "react";
import { useServiceEntries, useUpdateStatus } from "@/hooks/useServiceEntries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScannerModal = ({ isOpen, onClose }: ScannerModalProps) => {
  const { data: entries = [], isLoading: loadingEntries } = useServiceEntries();
  const updateStatus = useUpdateStatus();
  const { toast } = useToast();

  // Search & lookup state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Form State
  const [repairCost, setRepairCost] = useState<string>("");

  // Start QR scanner
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
        console.error("Error stopping scanner", err);
      }
      scannerRef.current = null;
    }

    // Wait a brief tick to ensure DOM element is mounted
    await new Promise((resolve) => setTimeout(resolve, 100));

    const element = document.getElementById("modal-reader");
    if (!element) return;

    try {
      const html5Qrcode = new Html5Qrcode("modal-reader");
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
          toast({ title: "✓ QR Scanned", description: `Service ID: ${decodedText}` });
          setSelectedServiceId(decodedText);
          void stopScanner();
        },
        () => {
          // Ignore verbose scanner output
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setCameraError(
        "Could not access camera. Please verify permissions. Camera scanning requires a secure connection (HTTPS or Localhost)."
      );
      setCameraActive(false);
    }
  };

  // Stop QR scanner
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

  // Lifecycle control based on Dialog opening
  useEffect(() => {
    if (isOpen) {
      // Clear previous search details on fresh open
      setSelectedServiceId(null);
      setSearchQuery("");
      setRepairCost("");
      void startScanner();
    } else {
      void stopScanner();
    }

    return () => {
      if (scannerRef.current) {
        void stopScanner();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Find matched record
  const matchedEntry = useMemo(() => {
    if (!selectedServiceId) return null;
    return entries.find((e) => e.service_id.toUpperCase().trim() === selectedServiceId.toUpperCase().trim()) || null;
  }, [entries, selectedServiceId]);

  // Populate cost
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
      onClose(); // Close modal upon successful delivery completion
    } catch (err) {
      console.error("Delivery failed", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-[95%] p-5 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Scan & Deliver Verification
          </DialogTitle>
          <DialogDescription className="text-xs">
            Scan machine receipt QR code or lookup manually to confirm delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Main Area: Scanner or Looked-up details */}
          {!selectedServiceId ? (
            <div className="space-y-4">
              {/* Camera Frame */}
              <div className="w-full aspect-square max-w-[280px] mx-auto overflow-hidden rounded-2xl bg-black border-2 border-muted relative shadow-inner flex flex-col items-center justify-center">
                {cameraActive && (
                  <>
                    <div className="absolute inset-0 border-[3px] border-primary/20 pointer-events-none rounded-2xl z-10" />
                    <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg z-10 animate-pulse" />
                    <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg z-10 animate-pulse" />
                    <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg z-10 animate-pulse" />
                    <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-lg z-10 animate-pulse" />
                    <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)] z-10 animate-[bounce_3s_infinite]" />
                  </>
                )}

                <div id="modal-reader" className="w-full h-full" />

                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center space-y-2">
                    {cameraError ? (
                      <>
                        <AlertTriangle className="h-8 w-8 text-rose-500" />
                        <p className="text-[10px] font-semibold leading-normal">{cameraError}</p>
                        <Button
                          size="sm"
                          onClick={startScanner}
                          className="bg-primary hover:bg-primary/90 font-bold text-xs h-8 px-3"
                        >
                          <Camera className="h-3.5 w-3.5 mr-1" /> Retry Camera
                        </Button>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs">Initializing camera...</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Lookup Form */}
              <div className="border-t pt-3">
                <form onSubmit={handleManualSearch} className="space-y-2">
                  <Label htmlFor="modalSearch" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Or Enter Service ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="modalSearch"
                      placeholder="e.g. SM-0001"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="font-mono text-sm h-10 shadow-sm"
                    />
                    <Button type="submit" className="h-10 active:scale-95 transition-transform">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : loadingEntries ? (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading service records...</p>
            </div>
          ) : !matchedEntry ? (
            <div className="p-6 text-center space-y-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
              <div>
                <h3 className="font-bold text-rose-600 text-sm">Service ID Not Found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  &quot;{selectedServiceId}&quot; is not matching any entry.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => setSelectedServiceId(null)}>
                  Retry Scan
                </Button>
                <Button size="sm" onClick={startScanner}>
                  <Camera className="h-3.5 w-3.5 mr-1" /> Re-open Camera
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Matched Details Header */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-mono font-bold text-primary text-sm">{matchedEntry.service_id}</span>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Estimated: ₹{matchedEntry.estimated_cost}</p>
                </div>
                <Badge variant="outline" className={`font-bold text-[10px] uppercase ${statusColors[matchedEntry.status]}`}>
                  {matchedEntry.status}
                </Badge>
              </div>

              {/* Status Warning Alerts */}
              {matchedEntry.status === "pending" && (
                <div className="flex gap-2 p-2.5 rounded-lg border border-orange-200 bg-orange-500/5 text-orange-600 text-[11px] font-medium leading-normal">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pending Repair</span>: Confirm sewing machine has actually been repaired.
                  </div>
                </div>
              )}

              {matchedEntry.status === "delivered" && (
                <div className="flex gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-500/5 text-emerald-600 text-[11px] font-medium leading-normal">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Already Delivered</span>: Completed on {formatDate(matchedEntry.delivered_at || matchedEntry.updated_at)} for ₹{matchedEntry.estimated_cost}.
                  </div>
                </div>
              )}

              {/* Customer details info */}
              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Customer: <strong className="text-slate-900">{matchedEntry.customer_name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Phone: <strong className="text-slate-900">{matchedEntry.customer_phone}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">Brand: <strong className="text-slate-900">{matchedEntry.machine_brand || "General"}</strong></span>
                  <Badge variant="secondary" className="text-[8px] uppercase tracking-wider ml-auto font-bold shrink-0">
                    {matchedEntry.unit === "unit_2" ? "Unit 2" : "Unit 1"}
                  </Badge>
                </div>
              </div>

              {/* Action Form (Active if not delivered) */}
              {matchedEntry.status !== "delivered" && (
                <div className="border-t pt-4 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="modalCost" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-primary" /> Repair & Delivery Cost (₹) *
                    </Label>
                    <Input
                      id="modalCost"
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
                    className="w-full h-11 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white shadow-md flex items-center justify-center"
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

              {/* Reset to scanner */}
              <div className="flex gap-2 justify-center pt-2">
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setSelectedServiceId(null)}>
                  Scan Another Bill
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Date formatter helper
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

export default ScannerModal;
