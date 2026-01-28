
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.7"

// Initialize Supabase Client (Standard for Edge Functions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Set VAPID details
  // Note: In production, use Deno.env.get('VAPID_PRIVATE_KEY')
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    'BBD6KDYqYXi-NfrLwG2mxGKI1laRawJF6KeCukcY5lUEG0BvxqXQPK2nNP9keNtacuT5CmlpAjpDLxHTn-PjVPM',
    'ZPT7JFOFIXJDG_Ywg7NPD0TqVnaX35-cTps5OeFR49A' // Generated Private Key
  );

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request
    const { record } = await req.json()
    const notificationPayload = JSON.stringify({
      title: record.title,
      message: record.message,
      url: record.url,
      icon: record.icon
    });

    // Get all subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (error) throw error

    console.log(`Sending notification to ${subscriptions.length} subscribers`)

    // Send notifications in parallel
    const promises = subscriptions.map((sub: any) => {
      // Reconstruction of subscription object for web-push
      const subObject = {
        endpoint: sub.endpoint,
        keys: {
            p256dh: sub.p256dh, // Stored as base64 in DB? Yes, we used btoa() in frontend.
            auth: sub.auth
        }
      }

      return webpush.sendNotification(
        subObject,
        notificationPayload
      ).catch((err: any) => {
        if (err.statusCode === 410) {
          // Subscription expired, delete from DB
          console.log(`Deleting expired subscription: ${sub.id}`)
          return supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        console.error('Error sending push:', err)
      })
    })

    await Promise.all(promises)

    return new Response(
      JSON.stringify({ message: 'Notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
