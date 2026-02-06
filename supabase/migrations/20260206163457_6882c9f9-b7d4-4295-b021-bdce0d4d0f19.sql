-- Create table for geographic zones with polygon data
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  polygon_coordinates JSONB NOT NULL, -- Array of {lat, lng} points
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for geocoded locations (patients/professionals)
CREATE TABLE public.geocoded_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('patient', 'professional')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  geocoded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Create table for zone statistics
CREATE TABLE public.zone_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  total_patients INTEGER NOT NULL DEFAULT 0,
  total_professionals INTEGER NOT NULL DEFAULT 0,
  occupancy_level TEXT CHECK (occupancy_level IN ('low', 'medium', 'high')),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geocoded_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (demo purposes)
CREATE POLICY "Anyone can view zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Anyone can manage zones" ON public.zones FOR ALL USING (true);

CREATE POLICY "Anyone can view locations" ON public.geocoded_locations FOR SELECT USING (true);
CREATE POLICY "Anyone can manage locations" ON public.geocoded_locations FOR ALL USING (true);

CREATE POLICY "Anyone can view statistics" ON public.zone_statistics FOR SELECT USING (true);
CREATE POLICY "Anyone can manage statistics" ON public.zone_statistics FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geocoded_locations_updated_at
  BEFORE UPDATE ON public.geocoded_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster zone lookups
CREATE INDEX idx_geocoded_locations_zone ON public.geocoded_locations(zone_id);
CREATE INDEX idx_geocoded_locations_entity ON public.geocoded_locations(entity_type, entity_id);