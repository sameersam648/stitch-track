
-- Create service status enum
CREATE TYPE public.service_status AS ENUM ('pending', 'repaired', 'delivered');

-- Create service entries table
CREATE TABLE public.service_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  machine_brand TEXT,
  problem_description TEXT,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  advance_paid NUMERIC(10,2) DEFAULT 0,
  photo_url TEXT,
  status service_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  repaired_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.service_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can do everything (admin-only app)
CREATE POLICY "Authenticated users can view all entries"
ON public.service_entries FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create entries"
ON public.service_entries FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update entries"
ON public.service_entries FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete entries"
ON public.service_entries FOR DELETE TO authenticated
USING (true);

-- Sequence for service IDs
CREATE SEQUENCE public.service_id_seq START 1;

-- Function to generate service ID
CREATE OR REPLACE FUNCTION public.generate_service_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.service_id := 'SM-' || LPAD(nextval('public.service_id_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_service_id
BEFORE INSERT ON public.service_entries
FOR EACH ROW
EXECUTE FUNCTION public.generate_service_id();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_service_entries_updated_at
BEFORE UPDATE ON public.service_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for machine photos
INSERT INTO storage.buckets (id, name, public) VALUES ('machine-photos', 'machine-photos', true);

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'machine-photos');

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'machine-photos');

CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'machine-photos');
