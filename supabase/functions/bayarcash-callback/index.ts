// @ts-nocheck - Deno types not available in IDE, but will work in Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get callback parameters
    const callbackData: any = {};
    const url = new URL(req.url);
    url.searchParams.forEach((value, key) => {
      callbackData[key] = value;
    });

    // Also check body for POST data
    if (req.body) {
      const bodyData = await req.json();
      Object.assign(callbackData, bodyData);
    }

    // Get BayarCash credentials
    const apiSecretKey = Deno.env.get('BAYARCASH_API_SECRET_KEY');

    if (!apiSecretKey) {
      console.error('BayarCash credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'BayarCash credentials not configured',
          message: 'Please set BAYARCASH_API_SECRET_KEY in Edge Function environment variables'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Verify callback signature
    const isValid = await verifyCallback(apiSecretKey, callbackData);

    if (!isValid) {
      console.error('Invalid callback signature');
      return new Response('Invalid signature', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Extract relevant data
    const orderNumber = callbackData.order_number;
    const status = callbackData.status;
    const paymentIntentId = callbackData.payment_intent_id;

    if (!orderNumber) {
      console.error('Missing order number in callback');
      return new Response('Missing order number', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Determine new booking status
    let newStatus: 'pending' | 'pending_payment' | 'payment_failed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' = 'pending';
    if (status === '3' || status === 'success') {
      newStatus = 'confirmed';
    } else if (status === '2' || status === 'failed') {
      newStatus = 'payment_failed';
    } else if (status === '1' || status === 'pending') {
      newStatus = 'pending_payment';
    }

    // Update booking in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        payment_proof_url: paymentIntentId ? `bayarcash:${paymentIntentId}` : null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderNumber);

    if (error) {
      console.error('Error updating booking status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update booking' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log(`Booking ${orderNumber} updated to status: ${newStatus}`);

    return new Response('OK', { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});

// Verify callback signature
async function verifyCallback(secretKey: string, data: any): Promise<boolean> {
  const receivedChecksum = data.checksum;
  if (!receivedChecksum) return false;

  const dataWithoutChecksum = { ...data };
  delete dataWithoutChecksum.checksum;

  const sortedKeys = Object.keys(dataWithoutChecksum).sort();
  const stringToHash = sortedKeys
    .map(key => `${key}=${dataWithoutChecksum[key]}`)
    .join('&') + secretKey;

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === receivedChecksum;
}
