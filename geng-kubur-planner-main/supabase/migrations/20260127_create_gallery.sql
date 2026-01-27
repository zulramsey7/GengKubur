
-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_items
DROP POLICY IF EXISTS "Public can view gallery items" ON gallery_items;
CREATE POLICY "Public can view gallery items"
ON gallery_items FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Admin can manage gallery items" ON gallery_items;
CREATE POLICY "Admin can manage gallery items"
ON gallery_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket for gallery if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery bucket
DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');
