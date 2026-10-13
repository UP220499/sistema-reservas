-- Add airbnb_ical_url column to ubicacion table
ALTER TABLE public.ubicacion
ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT;
