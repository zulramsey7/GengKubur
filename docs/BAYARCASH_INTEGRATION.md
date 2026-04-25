# BayarCash Payment Gateway Integration (Supabase Edge Functions)

This document explains how to integrate and configure BayarCash payment gateway for the GengKubur application using Supabase Edge Functions for secure server-side API calls.

## Overview

BayarCash is a Malaysian payment gateway that supports:
- FPX (Online Banking)
- DuitNow QR
- Credit Cards (Visa/Mastercard)
- E-wallets

**Architecture**: This implementation uses Supabase Edge Functions to securely handle BayarCash API calls, keeping credentials on the server-side and never exposing them to the client.

## Prerequisites

Before integrating BayarCash, you need:
1. A BayarCash merchant account - Sign up at [https://bayarcash.com/](https://bayarcash.com/)
2. API credentials from BayarCash dashboard
3. A portal key configured in BayarCash
4. Supabase project with Edge Functions enabled

## Configuration

### 1. Supabase Edge Function Environment Variables

Configure BayarCash credentials in Supabase Dashboard:

1. Go to Supabase Dashboard → Edge Functions
2. Select `bayarcash-create-payment` function
3. Click "Environment Variables"
4. Add the following variables:

```env
BAYARCASH_API_SECRET_KEY=your_bayarcash_api_secret_key
BAYARCASH_PORTAL_KEY=your_bayarcash_portal_key
BAYARCASH_SANDBOX=true
```

5. Repeat for `bayarcash-callback` function (same credentials)

### 2. Getting Your Credentials

1. Log in to your BayarCash dashboard at [https://dashboard.bayar.cash/](https://dashboard.bayar.cash/)
2. Navigate to Settings → API Keys
3. Generate or copy your:
   - API Token
   - API Secret Key
4. Navigate to Portals to get your Portal Key

### 3. Sandbox vs Production

- **Sandbox Mode**: Set `BAYARCASH_SANDBOX=true` for testing
- **Production Mode**: Set `BAYARCASH_SANDBOX=false` for live payments

Always test in sandbox mode before going live.

### 4. Deploy Edge Functions

Deploy the Edge Functions to Supabase:

```bash
# From project root
supabase functions deploy bayarcash-create-payment
supabase functions deploy bayarcash-callback
```

## How It Works

### Architecture

```
Client (Browser)
    ↓ (POST request)
Supabase Edge Function (bayarcash-create-payment)
    ↓ (Secure API call with credentials)
BayarCash API
    ↓ (Payment URL)
Client (Redirect to BayarCash)
    ↓ (Payment completion)
BayarCash Callback
    ↓ (POST to Edge Function)
Supabase Edge Function (bayarcash-callback)
    ↓ (Update database)
Supabase Database
```

### Payment Flow

1. **User selects payment method**: User chooses "Online / QR" in checkout
2. **Select payment channel**: User chooses FPX, DuitNow, or Credit Card
3. **Call Edge Function**: Client calls Supabase Edge Function to create payment intent
4. **Edge Function calls BayarCash**: Server-side API call with secure credentials
5. **Redirect to payment**: User is redirected to BayarCash secure payment page
6. **Complete payment**: User completes payment on BayarCash
7. **Callback**: BayarCash sends callback to Edge Function
8. **Status update**: Edge Function updates booking status in database
9. **Return URL**: User is redirected to `/payment-return`
10. **Display result**: User sees payment result

### Payment Statuses

The application uses the following booking statuses:

- `pending_payment`: Payment initiated, waiting for completion
- `confirmed`: Payment successful, booking confirmed
- `payment_failed`: Payment failed or cancelled
- `pending`: Manual payment, waiting for verification
- `in_progress`: Work in progress
- `completed`: Work completed
- `cancelled`: Booking cancelled

### Payment Methods

- `bayarcash`: Payment through BayarCash gateway
- `manual_transfer`: Manual bank transfer
- `cash`: Cash payment

## Edge Functions

### 1. bayarcash-create-payment

**Location**: `supabase/functions/bayarcash-create-payment/index.ts`

**Purpose**: Creates payment intent with BayarCash API

**Request**:
```json
{
  "order_number": "ORDER123",
  "amount": 100.00,
  "payer_name": "John Doe",
  "payer_email": "john@example.com",
  "payer_telephone_number": "60123456789",
  "payment_channel": "FPX"
}
```

**Response**:
```json
{
  "url": "https://payment.bayar.cash/...",
  "payment_intent_id": "pi_...",
  "status": "pending"
}
```

### 2. bayarcash-callback

**Location**: `supabase/functions/bayarcash-callback/index.ts`

**Purpose**: Handles BayarCash payment callbacks and updates booking status

**Callback Data**: Receives POST data from BayarCash with payment status

**Actions**:
- Verifies callback signature
- Updates booking status in database
- Returns 200 OK to acknowledge receipt

## Client Integration

### CheckoutModal

The checkout modal calls the Edge Function:

```typescript
const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bayarcash-create-payment`;

const response = await fetch(edgeFunctionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    order_number: order.orderId,
    amount: order.totalAmount,
    payer_name: order.customerName,
    payer_email: `${order.phoneNumber}@tempahan.gengkubur.com`,
    payer_telephone_number: order.phoneNumber,
    payment_channel: selectedPaymentChannel,
  }),
});
```

### Payment Channels

Supported payment channels:
- `FPX`: Online Banking
- `DUITNOW`: DuitNow QR
- `CREDIT_CARD`: Visa/Mastercard

## Security Benefits

### Why Edge Functions?

1. **Credentials Never Exposed**: BayarCash API keys are stored server-side
2. **Secure Checksum Generation**: MD5 hashing happens on server
3. **Callback Verification**: Server verifies callback signatures
4. **No Client-Side Secrets**: No sensitive data in browser
5. **HTTPS by Default**: Supabase Edge Functions use HTTPS automatically

### Security Features

- Environment variables for credentials
- Callback signature verification
- Input validation
- Error handling without exposing details
- CORS protection

## Testing

### Local Testing

Test Edge Functions locally:

```bash
supabase functions serve bayarcash-create-payment
supabase functions serve bayarcash-callback
```

### Sandbox Testing

1. Set `BAYARCASH_SANDBOX=true` in Edge Function env vars
2. Use BayarCash sandbox credentials
3. Test with sandbox payment methods
4. Verify callback handling
5. Check booking status updates in database

### Test Scenarios

- Successful payment
- Failed payment
- Cancelled payment
- Invalid callback signature
- Network timeout
- Missing credentials

## Troubleshooting

### Common Issues

**Issue**: Edge Function not accessible
- **Solution**: Check function is deployed: `supabase functions list`

**Issue**: Payment fails to create
- **Solution**: Verify Edge Function environment variables are set correctly

**Issue**: Callback not received
- **Solution**: Check BayarCash callback URL is configured correctly

**Issue**: Status not updating
- **Solution**: Check database connection and Edge Function logs

**Issue**: CORS errors
- **Solution**: Ensure Edge Function has proper CORS configuration

### Debugging

View Edge Function logs:

```bash
supabase functions logs bayarcash-create-payment
supabase functions logs bayarcash-callback
```

## Production Deployment

### Checklist

- [ ] Switch to production BayarCash credentials
- [ ] Set `BAYARCASH_SANDBOX=false` in Edge Function env vars
- [ ] Deploy Edge Functions to production
- [ ] Test payment flow end-to-end
- [ ] Monitor Edge Function logs
- [ ] Set up error monitoring
- [ ] Configure webhook URLs in BayarCash dashboard

### Webhook Configuration

Configure your BayarCash webhooks:
- Callback URL: `https://your-project.supabase.co/functions/v1/bayarcash-callback`
- Return URL: `https://yourdomain.com/payment-return`

### Monitoring

Monitor Edge Functions:
- Supabase Dashboard → Edge Functions → Logs
- Set up error alerts
- Track payment success rates
- Monitor callback failures

## Support

For BayarCash-specific issues:
- Documentation: [https://docs.bayarcash.com/](https://docs.bayarcash.com/)
- Support: Contact Aina at +6019-411 1865
- Status: [https://status.bayar.cash/](https://status.bayar.cash/)

For Supabase Edge Functions:
- Documentation: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- CLI Reference: [https://supabase.com/docs/reference/cli](https://supabase.com/docs/reference/cli)

## Additional Resources

- [BayarCash API Documentation](https://docs.bayarcash.com/680)
- [Payment Channel List](https://docs.bayarcash.com/336)
- [Transaction Checker](https://check.bayar.cash/)

## Notes

- Edge Functions use Deno runtime with Web Crypto API for MD5 hashing
- Credentials are stored in Supabase Edge Function environment variables
- Never commit credentials to version control
- Regularly rotate API keys
- Monitor Edge Function usage and costs
