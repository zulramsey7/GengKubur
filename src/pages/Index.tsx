import { useState, useRef, useEffect } from "react";
import { Package, BookingDetails, OrderSummary } from "@/types/booking";
import { ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import PackagesSection from "@/components/PackagesSection";
import BookingForm from "@/components/BookingForm";
import CheckoutModal from "@/components/CheckoutModal";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import WhyChooseUs from "@/components/WhyChooseUs";
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set page title
    document.title = "Geng Kubur - Perkhidmatan Pengurusan Kubur";

    // Handle scroll for "Back to Top" button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

    const totalPrice = (details.selectedPackage?.price || 0) + (details.additionalItems?.reduce((sum, item) => sum + item.price, 0) || 0);

    const order: OrderSummary = {
      ...details,
      orderId,
      orderDate,
      totalAmount: totalPrice,
    };

    if (details.selectedPackage?.id === 'custom') {
      try {
        const { error } = await supabase
          .from('bookings')
          .insert({
            customer_name: details.customerName,
            phone_number: details.phoneNumber,
            location: `${details.location} (Lot: ${details.graveLotNumber})`,
            notes: details.notes,
            package_id: details.selectedPackage.id,
            package_name: details.selectedPackage.name,
            package_price: details.selectedPackage.price,
            order_id: orderId,
            status: 'pending',
            before_photo_url: details.beforePhotoUrl,
            additional_items: details.additionalItems?.map(item => ({
              description: item.name,
              price: item.price
            }))
          });

        if (error) throw error;

        toast({
          title: "Permintaan Diterima",
          description: "Kami akan menghubungi anda untuk sebut harga.",
          duration: 5000,
        });
        
        setShowBookingForm(false);
        setSelectedPackage(null);
        return;
      } catch (error) {
        console.error('Error creating custom booking:', error);
        toast({
          title: "Ralat",
          description: "Gagal menghantar permintaan. Sila cuba lagi.",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentOrder(order);
    setShowBookingForm(false);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setCurrentOrder(null);
    setSelectedPackage(null);
  };

  const handleBackToBooking = () => {
    setShowCheckout(false);
    setShowBookingForm(true);
  };

  const isBookingProcess = showBookingForm || showCheckout;

  return (
    <div className="min-h-screen bg-background">
      {!isBookingProcess && <Navbar />}
      
      <div id="hero">
        <HeroSection />
      </div>

      <WhyChooseUs />

      <AboutSection />
      
      <PackagesSection 
        selectedPackage={selectedPackage} 
        onSelectPackage={handleSelectPackage} 
      />

      <div className="bg-muted/30">
        <GallerySection />
      </div>

      <FAQSection />

      <div id="contact">
        <Footer />
      </div>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Lengkapkan Tempahan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <BookingForm 
              selectedPackage={selectedPackage}
              onSubmit={handleBookingSubmit}
              initialDetails={currentOrder}
            />
          </div>
        </DialogContent>
      </Dialog>

      {showCheckout && currentOrder && (
        <CheckoutModal
          onClose={handleCloseCheckout}
          onBack={handleBackToBooking}
          order={currentOrder}
          whatsappNumber={WHATSAPP_NUMBER}
          qrImageUrl={QR_CODE_URL}
        />
      )}

      {!isBookingProcess && <WhatsAppFloat />}
      
      {/* Scroll To Top Button */}
      {!isBookingProcess && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-24 right-5 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
