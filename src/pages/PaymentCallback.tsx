import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getBayarCash } from "@/integrations/bayarcash/bayarcash";
import { supabase } from "@/integrations/supabase/client";

/**
 * Payment Callback Handler for BayarCash
 * This page receives server-to-server callbacks from BayarCash
 * It updates the booking status based on payment result
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get callback parameters
        const callbackData: any = {};
        searchParams.forEach((value, key) => {
          callbackData[key] = value;
        });

        // Verify callback with BayarCash
        const bayarCash = getBayarCash();
        const isValid = bayarCash.verifyCallback(callbackData);

        if (!isValid) {
          console.error('Invalid callback signature');
          return;
        }

        // Extract relevant data
        const orderNumber = callbackData.order_number;
        const status = callbackData.status;
        const paymentIntentId = callbackData.payment_intent_id;

        if (!orderNumber) {
          console.error('Missing order number in callback');
          return;
        }

        // Update booking status based on payment status
        let newStatus: 'pending' | 'pending_payment' | 'payment_failed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' = 'pending';
        if (status === '3' || status === 'success') {
          newStatus = 'confirmed';
        } else if (status === '2' || status === 'failed') {
          newStatus = 'payment_failed';
        } else if (status === '1' || status === 'pending') {
          newStatus = 'pending_payment';
        }

        // Update booking in database
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
        } else {
          console.log(`Booking ${orderNumber} updated to status: ${newStatus}`);
        }

        // Return success response to BayarCash
        // In a real implementation, this should be a server-side endpoint
        // For now, we'll just log it
        console.log('Callback processed successfully');
      } catch (error) {
        console.error('Error processing payment callback:', error);
      }
    };

    handleCallback();
  }, [searchParams]);

  // This page should not render anything visible
  // It's meant for server-side callback handling
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processing payment callback...</p>
    </div>
  );
};

export default PaymentCallback;
