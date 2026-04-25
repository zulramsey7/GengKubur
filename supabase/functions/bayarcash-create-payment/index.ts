// @ts-nocheck - Deno types not available in IDE, but will work in Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

// BayarCash API Configuration
const BAYARCASH_API_URL = Deno.env.get('BAYARCASH_SANDBOX') === 'true'
  ? 'https://api.bayar.cash/api/v3'  // Using production URL for testing (sandbox has DNS issues)
  : 'https://api.bayar.cash/api/v3';

interface PaymentIntentRequest {
  order_number: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_telephone_number: string;
  payment_channel: string;
}

interface PaymentData {
  portal_key: string;
  order_number: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_telephone_number: string;
  callback_url: string;
  return_url: string;
  payment_channel: string;
  checksum?: string;
}

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

    const { order_number, amount, payer_name, payer_email, payer_telephone_number, payment_channel }: PaymentIntentRequest = await req.json();

    // Validate required fields
    if (!order_number || !amount || !payer_name || !payer_email || !payer_telephone_number || !payment_channel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Get BayarCash credentials from environment
    const apiSecretKey = Deno.env.get('BAYARCASH_API_SECRET_KEY');
    const portalKey = Deno.env.get('BAYARCASH_PORTAL_KEY');

    if (!apiSecretKey || !portalKey) {
      console.error('BayarCash credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'BayarCash credentials not configured',
          message: 'Please set BAYARCASH_API_SECRET_KEY and BAYARCASH_PORTAL_KEY in Edge Function environment variables'
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

    // Prepare payment data
    const paymentData: PaymentData = {
      portal_key: portalKey,
      order_number,
      amount,
      payer_name,
      payer_email,
      payer_telephone_number,
      callback_url: `${req.headers.get('origin')}/payment-callback`,
      return_url: `${req.headers.get('origin')}/payment-return?order_id=${order_number}`,
      payment_channel,
    };

    // Generate checksum
    const checksum = await generateChecksum(apiSecretKey, paymentData);
    paymentData.checksum = checksum;

    // Call BayarCash API
    const response = await fetch(`${BAYARCASH_API_URL}/payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('BayarCash API error:', result);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to create payment intent' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Update booking status to pending_payment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'pending_payment',
        payment_method: 'bayarcash',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_number);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    return new Response(
      JSON.stringify({
        url: result.url,
        payment_intent_id: result.payment_intent_id,
        status: result.status,
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

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

// Simple SHA-256 implementation for checksum generation (MD5 not supported in Deno v2.1.4)
async function generateChecksum(secretKey: string, data: any): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  const stringToHash = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&') + secretKey;

  // Use Web Crypto API for SHA-256 (MD5 not supported in Deno v2.1.4)
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
