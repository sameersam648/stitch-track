import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ServiceEntry = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  machine_brand: string | null;
  problem_description: string | null;
  estimated_cost: number;
  unit: string;
  photo_url: string | null;
  status: "pending" | "repaired" | "delivered";
  created_at: string;
  updated_at: string;
  repaired_at: string | null;
  delivered_at: string | null;
  created_by: string | null;
};

export const useServiceEntries = () => {
  return useQuery({
    queryKey: ["service-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ServiceEntry[];
    },
  });
};

export const useCreateServiceEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      customer_name: string;
      customer_phone: string;
      machine_brand?: string;
      problem_description?: string;
      estimated_cost?: number;
      unit?: string;
      photo_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("service_entries")
        .insert([{ ...entry, created_by: user?.id, service_id: "placeholder" }] as any)
        .select()
        .single();
      if (error) throw error;
      return data as ServiceEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-entries"] });
      toast({ title: "Service entry created!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "repaired" | "delivered" }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "repaired") updates.repaired_at = new Date().toISOString();
      if (status === "delivered") updates.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from("service_entries")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["service-entries"] });
      toast({ title: `Marked as ${status}!` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useUploadPhoto = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("machine-photos")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("machine-photos")
        .getPublicUrl(fileName);
      return data.publicUrl;
    },
  });
};
