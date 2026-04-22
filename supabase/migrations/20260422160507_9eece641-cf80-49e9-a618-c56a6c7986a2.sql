-- Add signature_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- Create public bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Signatures are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own signature"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signatures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own signature"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signatures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own signature"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signatures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);