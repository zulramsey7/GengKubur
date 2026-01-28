import { useState, useRef } from "react";
import { Package, BookingDetails, OrderSummary } from "@/types/booking";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import PackagesSection from "@/components/PackagesSection";
import BookingForm from "@/components/BookingForm";
import CheckoutModal from "@/components/CheckoutModal";
import Footer from "@/components/Footer";
import BackgroundMusic from "@/components/BackgroundMusic";
import paymentQrCode from "@/assets/payment-qr.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// Configuration
const WHATSAPP_NUMBER = "60173304906";
const QR_CODE_URL = paymentQrCode;

const Index = () => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderSummary | null>(null);
  const { toast } = useToast();

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowBookingForm(true);
  };

  const generateOrderId = () => {
    const prefix = "GK";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleBookingSubmit = async (details: BookingDetails) => {
    if (!details.selectedPackage) return;

    const orderId = generateOrderId();
    const orderDate = new Date().toLocaleDateString("ms-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const addonsTotal = details.additionalItems.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = details.selectedPackage.price + addonsTotal;

    // Prepare additional items for DB
    const dbAdditionalItems = details.additionalItems.map(item => ({
      description: item.name,
      price: item.price
    }));

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_name: details.customerName,
          phone_number: details.phoneNumber,
          location: details.location,
          notes: details.notes,
          package_id: details.selectedPackage.id,
          package_name: details.selectedPackage.name,
          package_price: details.selectedPackage.price,
          order_id: orderId,
          status: 'pending',
          additional_items: dbAdditionalItems
        });

      if (error) throw error;

      setShowBookingForm(false); // Close booking modal

      if (details.selectedPackage.id === 'custom') {
        toast({
          title: "Permintaan Diterima",
          description: "Kami akan menghubungi anda untuk sebut harga.",
          duration: 5000,
        });
        
        setSelectedPackage(null);
        return;
      }

      const order: OrderSummary = {
        ...details,
        orderId,
        orderDate,
        totalAmount: totalPrice,
      };

      setCurrentOrder(order);
      setShowCheckout(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Ralat",
        description: "Gagal mencipta tempahan. Sila cuba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setCurrentOrder(null);
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <BackgroundMusic />
      <Navbar />
      
      <div id="hero">
        <HeroSection />
      </div>

      <AboutSection />
      
      <PackagesSection 
        selectedPackage={selectedPackage} 
        onSelectPackage={handleSelectPackage} 
      />

      <div className="bg-muted/30">
        <GallerySection />
      </div>

      <div id="contact">
        <Footer />
      </div>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lengkapkan Tempahan</DialogTitle>
            <DialogDescription>
              Sila isi maklumat di bawah untuk meneruskan tempahan pakej {selectedPackage?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <BookingForm 
              selectedPackage={selectedPackage}
              onSubmit={handleBookingSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      {showCheckout && currentOrder && (
        <CheckoutModal
          onClose={handleCloseCheckout}
          order={currentOrder}
          whatsappNumber={WHATSAPP_NUMBER}
          qrImageUrl={QR_CODE_URL}
        />
      )}

      <WhatsAppFloat />
    </div>
  );
};

export default Index;
