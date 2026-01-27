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

// Configuration
const WHATSAPP_NUMBER = "60173304906";
const QR_CODE_URL = paymentQrCode;

const Index = () => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderSummary | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    // Scroll to form after selection
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
          status: 'pending'
        });

      if (error) throw error;

      if (details.selectedPackage.id === 'custom') {
        toast({
          title: "Permintaan Diterima",
          description: "Kami akan menghubungi anda untuk sebut harga.",
          duration: 5000,
        });
        
        // Reset form selection but not show checkout
        setSelectedPackage(null);
        // Optional: Scroll to top or packages
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const order: OrderSummary = {
        ...details,
        orderId,
        orderDate,
        totalAmount: details.selectedPackage.price,
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

      <GallerySection />

      <div className="container py-12 md:py-16">
        <div ref={formRef}>
          <BookingForm 
            selectedPackage={selectedPackage}
            onSubmit={handleBookingSubmit}
          />
        </div>
      </div>

      <div id="contact">
        <Footer />
      </div>

      {showCheckout && currentOrder && (
        <CheckoutModal
          onClose={handleCloseCheckout}
          order={currentOrder}
          whatsappNumber={WHATSAPP_NUMBER}
          qrImageUrl={QR_CODE_URL}
        />
      )}
    </div>
  );
};

export default Index;
