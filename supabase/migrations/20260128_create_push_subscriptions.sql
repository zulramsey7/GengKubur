
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable insert for authenticated users" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for own subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
    
-- Allow anon insert (for testing or public notifications if needed, though authenticated is better)
CREATE POLICY "Enable insert for anon" ON public.push_subscriptions
    FOR INSERT WITH CHECK (true);
