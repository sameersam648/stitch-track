import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateServiceEntry, useUploadPhoto } from "@/hooks/useServiceEntries";
import { Camera, Upload, Loader2, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewEntry = () => {
  const navigate = useNavigate();
  const createEntry = useCreateServiceEntry();
  const uploadPhoto = useUploadPhoto();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voice recognition state
  const [listeningField, setListeningField] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    machine_brand: "",
    problem_description: "",
    estimated_cost: "",
    unit: "unit_1",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Stop error:", e);
      }
      recognitionRef.current = null;
    }
    setListeningField(null);
  }, []);

  const startListening = useCallback((fieldName: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser. Please use Google Chrome.",
        variant: "destructive",
      });
      return;
    }

    if (!window.isSecureContext) {
      toast({
        title: "Mic Access Blocked (Insecure Connection)",
        description: "Microphone access requires HTTPS or Localhost. Since you are using an IP address (HTTP), the browser blocks it for safety.",
        variant: "destructive",
      });
      return;
    }

    if (recognitionRef.current) {
      stopListening();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Supports English (India)
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("Voice recognition started for:", fieldName);
      setListeningField(fieldName);
      toast({ title: "Listening...", description: "Speak now..." });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript received:", transcript);
      if (transcript) {
        setForm((prev) => ({
          ...prev,
          [fieldName]: prev[fieldName as keyof typeof prev]
            ? prev[fieldName as keyof typeof prev] + " " + transcript
            : transcript,
        }));
        toast({ title: "🎤 Voice Added", description: transcript });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === "not-allowed") {
        const message = window.isSecureContext
          ? "Please allow microphone access in browser settings."
          : "Mic access is blocked on insecure connections (HTTP). Please use HTTPS or Localhost.";

        toast({
          title: "Mic Access Denied",
          description: message,
          variant: "destructive",
        });
      }
      setListeningField(null);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
      setListeningField(null);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Recognition start failed:", err);
      setListeningField(null);
    }
  }, [stopListening, toast]);

  const handleMicClick = (fieldName: string) => {
    if (listeningField === fieldName) {
      stopListening();
    } else {
      startListening(fieldName);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(form.customer_phone)) {
      toast({
        title: "Invalid Phone",
        description: "Enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    try {
      let photo_url: string | undefined;
      if (photoFile) {
        photo_url = await uploadPhoto.mutateAsync(photoFile);
      }

      console.log("Submitting form:", form);
      const entry = await createEntry.mutateAsync({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        machine_brand: form.machine_brand || undefined,
        problem_description: form.problem_description || undefined,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : 0,
        unit: form.unit,
        photo_url,
      });

      if (entry) {
        const message = encodeURIComponent(
          `Hello ${form.customer_name}, your sewing machine has been received.\n` +
          `Service ID: ${entry.service_id}\n` +
          `Unit: ${form.unit === "unit_1" ? "Unit 1" : "Unit 2"}\n` +
          `Problem: ${form.problem_description || "General Service"}\n` +
          `We will notify you once it is repaired.`
        );
        window.open(`https://wa.me/91${form.customer_phone}?text=${message}`, "_blank");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Database error. Did you run the SQL migration?",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createEntry.isPending || uploadPhoto.isPending;

  const renderMicButton = (fieldName: string) => {
    const isActive = listeningField === fieldName;
    return (
      <Button
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="icon"
        className={`h-9 w-9 shrink-0 ${isActive ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "text-muted-foreground"}`}
        onClick={() => handleMicClick(fieldName)}
      >
        {isActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Service Entry</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Machine & Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Machine Photo</Label>
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
                <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" /> Camera
                </Button>
              </div>
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="mt-2 w-40 h-40 object-cover rounded-lg border" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Select Unit</Label>
              <div className="flex gap-3">
                {["unit_1", "unit_2"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setForm({ ...form, unit: u })}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${form.unit === u
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                  >
                    {u === "unit_1" ? "Unit 1" : "Unit 2"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <div className="flex gap-1 items-center">
                  <Input id="name" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                  {renderMicButton("customer_name")}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Machine Brand / Model</Label>
              <div className="flex gap-1 items-center">
                <Input id="brand" value={form.machine_brand} onChange={(e) => setForm({ ...form, machine_brand: e.target.value })} />
                {renderMicButton("machine_brand")}
              </div>
              <div className="flex gap-2 mt-1">
                {["Usha", "Merritt", "Singer"].map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setForm({ ...form, machine_brand: brand })}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                      form.machine_brand === brand
                        ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                        : "bg-card text-foreground hover:bg-muted border-input"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem">Problem Description</Label>
              <div className="flex gap-1 items-start">
                <Textarea id="problem" value={form.problem_description} onChange={(e) => setForm({ ...form, problem_description: e.target.value })} rows={3} />
                {renderMicButton("problem_description")}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, problem_description: "Full Service" })}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    form.problem_description === "Full Service"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                      : "bg-card text-foreground hover:bg-muted border-input"
                  }`}
                >
                  Full Service
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost (₹)</Label>
              <Input id="cost" type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save & Send WhatsApp"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewEntry;
