import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateServiceEntry, useUploadPhoto } from "@/hooks/useServiceEntries";
import { Camera, Upload, Loader2 } from "lucide-react";

const NewEntry = () => {
  const navigate = useNavigate();
  const createEntry = useCreateServiceEntry();
  const uploadPhoto = useUploadPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    machine_brand: "",
    problem_description: "",
    estimated_cost: "",
    advance_paid: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
      return;
    }

    let photo_url: string | undefined;
    if (photoFile) {
      photo_url = await uploadPhoto.mutateAsync(photoFile);
    }

    const entry = await createEntry.mutateAsync({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      machine_brand: form.machine_brand || undefined,
      problem_description: form.problem_description || undefined,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
      advance_paid: form.advance_paid ? parseFloat(form.advance_paid) : undefined,
      photo_url,
    });

    if (entry) {
      // Open WhatsApp with pre-filled message
      const message = encodeURIComponent(
        `Hello ${form.customer_name}, your sewing machine has been received.\n` +
        `Service ID: ${entry.service_id}\n` +
        `Problem: ${form.problem_description || 'General Service'}\n` +
        `We will notify you once it is repaired.`
      );
      window.open(`https://wa.me/91${form.customer_phone}?text=${message}`, "_blank");
      navigate("/");
    }
  };

  const isSubmitting = createEntry.isPending || uploadPhoto.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Service Entry</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Machine & Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo upload */}
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
                <img src={photoPreview} alt="Machine preview" className="mt-2 w-40 h-40 object-cover rounded-lg border" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="9876543210"
                  pattern="[6-9][0-9]{9}"
                  title="Enter valid 10-digit Indian mobile number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Machine Brand / Model</Label>
              <Input
                id="brand"
                value={form.machine_brand}
                onChange={(e) => setForm({ ...form, machine_brand: e.target.value })}
                placeholder="e.g. Singer, Usha, Brother"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem">Problem Description</Label>
              <Textarea
                id="problem"
                value={form.problem_description}
                onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Estimated Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  value={form.estimated_cost}
                  onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance">Advance Paid (₹)</Label>
                <Input
                  id="advance"
                  type="number"
                  min="0"
                  value={form.advance_paid}
                  onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Send WhatsApp"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewEntry;
