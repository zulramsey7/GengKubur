import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const orderId = searchParams.get('order_id');
  const paymentIntentId = searchParams.get('payment_intent_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus('failed');
        setMessage('ID tempahan tidak ditemui');
        return;
      }

      try {
        // Check database for payment status
        // The Edge Function callback handler would have already updated the status
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (booking) {
          if (booking.status === 'confirmed' || booking.status === 'completed') {
            setStatus('success');
            setMessage('Pembayaran berjaya! Tempahan anda telah disahkan.');
          } else if (booking.status === 'pending_payment') {
            setStatus('failed');
            setMessage('Pembayaran masih dalam proses. Sila tunggu pengesahan.');
          } else if (booking.status === 'payment_failed') {
            setStatus('failed');
            setMessage('Pembayaran gagal. Sila cuba lagi atau guna kaedah pembayaran lain.');
          } else {
            setStatus('success');
            setMessage('Tempahan anda telah direkodkan.');
          }
        } else {
          setStatus('failed');
          setMessage('Tempahan tidak ditemui.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('Ralat semasa mengesahkan pembayaran. Sila hubungi kami.');
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-lg p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Mengesahkan Pembayaran</h2>
                <p className="text-muted-foreground">Sila tunggu, kami sedang mengesahkan pembayaran anda...</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-700">Pembayaran Berjaya!</h2>
                <p className="text-muted-foreground">{message}</p>
                {orderId && (
                  <p className="text-sm font-mono text-primary bg-primary/5 inline-block px-3 py-1 rounded-full">
                    ID: {orderId}
                  </p>
                )}
              </div>
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => navigate('/tracking')}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Semak Status Tempahan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Laman Utama
                </Button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-red-700">Pembayaran Gagal</h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => navigate('/tracking')}
                  className="w-full"
                >
                  Semak Status Tempahan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Laman Utama
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
