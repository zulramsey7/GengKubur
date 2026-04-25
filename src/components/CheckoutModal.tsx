import { useState, useRef, useEffect } from "react";
import { X, Copy, Check, MessageCircle, QrCode, Calendar, User, MapPin, Package, Upload, Image, Loader2, CreditCard, Banknote, Plus, DollarSign, CheckCircle2, ShieldCheck, ChevronLeft, Download, ZoomIn, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderSummary } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProgressSteps } from "./ProgressSteps";

interface CheckoutModalProps {
  order: OrderSummary;
  onClose: () => void;
  onBack?: () => void;
  qrImageUrl: string;
  whatsappNumber: string;
}

const CheckoutModal = ({ order, onClose, onBack, qrImageUrl, whatsappNumber }: CheckoutModalProps) => {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [selectedPaymentChannel, setSelectedPaymentChannel] = useState<string>("FPX");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [useBayarCash, setUseBayarCash] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    toast({
      title: "Disalin!",
      description: "ID Tempahan telah disalin ke papan keratan",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllBankDetails = () => {
    const details = `Bank: Maybank\nNama Akaun: ZULFIKAR BIN AZIZUL\nNo. Akaun: 164810189215\nJumlah: RM ${order.totalAmount.toFixed(2)}`;
    navigator.clipboard.writeText(details);
    toast({
      title: "Semua Maklumat Disalin!",
      description: "Maklumat bank dan jumlah telah disalin untuk rujukan anda.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format tidak sah",
        description: "Sila muat naik gambar sahaja (JPG, PNG, dll)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fail terlalu besar",
        description: "Saiz maksimum adalah 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.orderId}-${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for preview
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Note: We don't update the booking table here anymore
      // because the booking hasn't been created yet.
      // We only set the local state for the preview and final submission.

      setUploadedProof(publicUrl);
      setPaymentConfirmed(false); // Reset confirmation for new file
      
      toast({
        title: "Berjaya!",
        description: "Bukti pembayaran telah dimuat naik. Sila tekan butang Sahkan Bayaran.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik bukti pembayaran. Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const addonsText = order.additionalItems && order.additionalItems.length > 0 
      ? `\n➕ *Add-on:*\n${order.additionalItems.map(item => `- ${item.name} (RM ${item.price})`).join('\n')}`
      : "";

    const message = `🌿 *RESIT TEMPAHAN GENGKUBUR*

📋 *ID Tempahan:* ${order.orderId}
📅 *Tarikh:* ${order.orderDate}

👤 *Maklumat Pelanggan:*
Nama: ${order.customerName}
No. Tel: ${order.phoneNumber}
Lokasi: ${order.location}

${order.beforePhotoUrl ? `📸 *Gambar Lokasi:* ${order.beforePhotoUrl}\n` : ""}📦 *Pakej Dipilih:*
${order.selectedPackage?.name} - ${order.selectedPackage?.description}${addonsText}

💰 *Jumlah Bayaran:* RM ${order.totalAmount}
💳 *Kaedah Bayaran:* ${paymentMethod === 'online' ? 'Online Transfer / QR' : 'Tunai (Cash)'}

${order.notes ? `📝 *Catatan:* ${order.notes}` : ""}

${paymentMethod === 'online' && uploadedProof ? `📸 *Bukti Pembayaran:* Telah dimuat naik` : ""}

Terima kasih kerana memilih GengKubur! 🙏`;

    return encodeURIComponent(message);
  };

  const handleBayarCashPayment = async () => {
    if (!useBayarCash) {
      toast({
        title: "BayarCash Tidak Tersedia",
        description: "Sila guna kaedah pembayaran manual",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Save booking first to get order ID
      const dbAdditionalItems = order.additionalItems?.map(item => ({
        description: item.name,
        price: item.price
      })) || [];

      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          customer_name: order.customerName,
          phone_number: order.phoneNumber,
          location: `${order.location} (Lot: ${order.graveLotNumber})`,
          notes: order.notes,
          package_id: order.selectedPackage?.id,
          package_name: order.selectedPackage?.name,
          package_price: order.selectedPackage?.price,
          order_id: order.orderId,
          status: 'pending',
          payment_method: 'bayarcash',
          payment_proof_url: null,
          additional_items: dbAdditionalItems
        });

      if (insertError) throw insertError;

      // Call Supabase Edge Function to create payment intent
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bayarcash-create-payment`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      if (result.url) {
        setPaymentUrl(result.url);
        // Redirect to BayarCash payment page
        window.open(result.url, '_blank');
        
        toast({
          title: "Bayaran Dimulakan",
          description: "Anda akan dialihkan ke halaman pembayaran BayarCash.",
        });
        
        onClose();
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (error) {
      console.error('BayarCash payment error:', error);
      toast({
        title: "Ralat Pembayaran",
        description: "Gagal memulakan pembayaran. Sila cuba kaedah manual.",
        variant: "destructive",
      });
      setUseBayarCash(false); // Fallback to manual
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleWhatsAppClick = async () => {
    try {
      // First, save the booking to Supabase since it's not saved yet
      const dbAdditionalItems = order.additionalItems?.map(item => ({
        description: item.name,
        price: item.price
      })) || [];

      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          customer_name: order.customerName,
          phone_number: order.phoneNumber,
          location: `${order.location} (Lot: ${order.graveLotNumber})`,
          notes: order.notes,
          package_id: order.selectedPackage?.id,
          package_name: order.selectedPackage?.name,
          package_price: order.selectedPackage?.price,
          order_id: order.orderId,
          status: 'pending',
          payment_method: paymentMethod === 'online' ? 'manual_transfer' : 'cash',
          payment_proof_url: uploadedProof,
          additional_items: dbAdditionalItems
        });

      if (insertError) throw insertError;

      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
      const message = generateWhatsAppMessage();
      
      toast({
        title: "Tempahan Dihantar",
        description: "Tempahan anda telah direkodkan. Sila teruskan ke WhatsApp.",
      });

      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
      onClose(); // Close modal after successful submission
    } catch (error) {
      console.error('Error saving booking at checkout:', error);
      toast({
        title: "Ralat",
        description: "Gagal menghantar tempahan. Sila cuba lagi atau hubungi kami terus.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = "GengKubur-Payment-QR.jpeg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Muat Turun Bermula",
      description: "Gambar QR sedang dimuat turun ke peranti anda.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-lg h-fit max-h-[90vh] flex flex-col rounded-2xl bg-card shadow-hover animate-scale-in">
        {/* Header - Fixed at top of modal */}
        <div className="flex items-center justify-between border-b bg-card px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-full p-2 hover:bg-muted transition-colors mr-1"
                title="Kembali ke Maklumat"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Checkout & Pembayaran</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <ProgressSteps currentStep={2} />
          {/* Order ID */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 sm:p-4 border border-primary/20">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">ID Tempahan</p>
              <p className="font-mono text-base sm:text-lg font-bold text-primary">{order.orderId}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyOrderId}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              {copied ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              ) : (
                <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>

          {/* Order Details */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Butiran Tempahan</h3>
            
            <div className="space-y-2 rounded-xl bg-muted/50 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Nama:</span>
                <span className="font-medium text-foreground truncate">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Lokasi:</span>
                <span className="font-medium text-foreground truncate">{order.location}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Pakej:</span>
                <span className="font-medium text-foreground">{order.selectedPackage?.name}</span>
              </div>


              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Tarikh:</span>
                <span className="font-medium text-foreground">{order.orderDate}</span>
              </div>
            </div>
          </div>

          {/* Total Amount & Price Breakdown */}
          <div className="rounded-2xl border-2 border-primary/20 bg-muted/30 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-tight">
                <DollarSign className="h-4 w-4" /> Ringkasan Pembayaran
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Package Price */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Pakej</span>
                  <span className="font-medium text-foreground">{order.selectedPackage?.name}</span>
                </div>
                <span className="font-bold text-foreground">RM {order.selectedPackage?.price.toFixed(2)}</span>
              </div>

              {/* Add-ons List */}
              {order.additionalItems && order.additionalItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-dashed border-muted-foreground/30">
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider block">Item Tambahan (Add-on)</span>
                  {order.additionalItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Plus className="h-3 w-3 text-primary" /> {item.name}
                      </span>
                      <span className="font-medium text-foreground">RM {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Total */}
              <div className="pt-3 border-t-2 border-primary/20 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-primary text-xs uppercase font-black tracking-widest">Jumlah Keseluruhan</span>
                  <span className="text-[10px] text-muted-foreground italic">Kerja dimulakan selepas bayaran disahkan</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-primary leading-none">RM {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="online" onValueChange={(v) => setPaymentMethod(v as "online" | "cash")}>
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="online" className="gap-2 text-xs sm:text-sm">
                <CreditCard className="h-4 w-4" />
                Online / QR
              </TabsTrigger>
              <TabsTrigger value="cash" className="gap-2 text-xs sm:text-sm">
                <Banknote className="h-4 w-4" />
                Tunai (Cash)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="space-y-4 sm:space-y-6">
              {/* BayarCash Payment Option */}
              {useBayarCash && (
                <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-primary">BayarCash Online</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Pembayaran pantas & selamat</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-[10px] font-bold text-green-700">Disyorkan</span>
                    </div>
                  </div>

                  {/* Payment Channel Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pilih Kaedah Pembayaran</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'FPX', name: 'FPX', icon: Smartphone, desc: 'Online Banking' },
                        { id: 'DUITNOW', name: 'DuitNow', icon: QrCode, desc: 'QR Code' },
                        { id: 'CREDIT_CARD', name: 'Kad Kredit', icon: CreditCard, desc: 'Visa/Mastercard' },
                      ].map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedPaymentChannel(channel.id)}
                          className={`
                            relative p-3 rounded-xl border-2 transition-all text-left
                            ${selectedPaymentChannel === channel.id 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-muted-foreground/20 bg-muted/30 hover:border-primary/30'}
                          `}
                        >
                          <div className="flex flex-col gap-1">
                            <channel.icon className={`h-5 w-5 ${selectedPaymentChannel === channel.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-bold ${selectedPaymentChannel === channel.id ? 'text-primary' : 'text-muted-foreground'}`}>{channel.name}</span>
                            <span className="text-[9px] text-muted-foreground">{channel.desc}</span>
                          </div>
                          {selectedPaymentChannel === channel.id && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleBayarCashPayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Bayar Sekarang dengan BayarCash
                      </>
                    )}
                  </Button>

                  <p className="text-center text-[10px] text-muted-foreground">
                    Anda akan dialihkan ke halaman pembayaran yang selamat
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-bold">Atau</span>
                </div>
              </div>

              {/* Bank Details (Manual Transfer) */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-semibold text-primary flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pindahan Manual / QR
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] sm:text-xs font-bold uppercase tracking-tight gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={handleCopyAllBankDetails}
                  >
                    <Copy className="h-3 w-3" />
                    Salin Semua
                  </Button>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between border-b border-primary/10 pb-1 sm:pb-2">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium uppercase tracking-tight text-foreground">Maybank</span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 pb-1 sm:pb-2">
                    <span className="text-muted-foreground">Nama Akaun</span>
                    <span className="font-bold text-right text-foreground">ZULFIKAR BIN AZIZUL</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">No. Akaun</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg sm:text-xl text-primary tracking-tighter">164810189215</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => {
                          navigator.clipboard.writeText("164810189215");
                          toast({ title: "Disalin!", description: "No. Akaun disalin" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Imbas QR untuk Pembayaran</h3>
                </div>
                
                <div 
                  className="group relative mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-xl border-4 border-primary/20 bg-card p-2 shadow-card cursor-pointer overflow-hidden transition-all hover:border-primary/50"
                  onClick={() => setIsQrZoomed(true)}
                >
                  <img
                    src={qrImageUrl}
                    alt="QR Code Pembayaran"
                    className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    Imbas kod QR di atas atau klik untuk besarkan & simpan
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] sm:text-xs font-bold uppercase tracking-tight gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadQR();
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Simpan Gambar QR
                  </Button>
                </div>
              </div>

              {/* QR Zoom Dialog */}
              <Dialog open={isQrZoomed} onOpenChange={setIsQrZoomed}>
                <DialogContent className="max-w-[90vw] sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                  <DialogHeader className="sr-only">
                    <DialogTitle>QR Code Pembayaran</DialogTitle>
                  </DialogHeader>
                  <div className="relative group bg-white rounded-2xl p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-primary/10">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">QR Pembayaran</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setIsQrZoomed(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white">
                      <img
                        src={qrImageUrl}
                        alt="QR Code Pembayaran Zoomed"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="mt-6 flex flex-col gap-3">
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg gap-2"
                        onClick={handleDownloadQR}
                      >
                        <Download className="h-5 w-5" />
                        Simpan Gambar (Download)
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Sila simpan kod QR ini untuk memudahkan pembayaran dalam aplikasi perbankan anda.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Payment Proof Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Muat Naik Bukti Pembayaran</h3>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {uploadedProof ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative mx-auto w-full max-w-[200px] sm:max-w-xs rounded-xl border-2 border-primary/30 bg-muted/30 p-2 overflow-hidden">
                      <img
                        src={uploadedProof}
                        alt="Bukti Pembayaran"
                        className="w-full h-auto rounded-lg object-contain max-h-32 sm:max-h-48"
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                      </div>
                    </div>
                    
                    {!paymentConfirmed ? (
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg"
                          onClick={() => setPaymentConfirmed(true)}
                        >
                          <CheckCircle2 className="mr-2 h-5 w-5" /> Sahkan Bayaran
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full text-xs text-muted-foreground underline"
                        >
                          <Image className="h-3 w-3 mr-1" />
                          Tukar Gambar
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center animate-in zoom-in-95 duration-300">
                        <p className="text-xs sm:text-sm text-green-700 font-medium">
                          <Check className="h-4 w-4 inline mr-1 text-green-600" />
                          Terima kasih! Bukti telah diterima. Sila tekan butang WhatsApp di bawah untuk pengesahan akhir dengan admin.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-20 sm:h-24 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 p-2"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Memuat naik...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 sm:gap-2 text-center">
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Klik untuk muat naik bukti pembayaran</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cash" className="py-4 sm:py-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold">Bayaran Tunai</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[240px] sm:max-w-xs mx-auto">
                    Sila buat pembayaran tunai secara terus kepada petugas kami di lokasi atau semasa perjumpaan.
                  </p>
                </div>
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg text-xs text-left max-w-sm mx-auto">
                  <p className="font-semibold mb-1 sm:mb-2">Nota:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Sila sediakan wang secukupnya jika boleh.</li>
                    <li>Resit rasmi akan dikeluarkan selepas bayaran diterima.</li>
                    <li>Tekan butang WhatsApp di bawah untuk maklumkan kepada admin.</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Policy & Terms Section */}
          <div className="rounded-xl border border-muted-foreground/10 bg-muted/20 p-3 sm:p-4 space-y-2">
            <h4 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Polisi & Terma Ringkas
            </h4>
            <ul className="grid grid-cols-1 gap-1.5 text-[10px] sm:text-xs text-muted-foreground/80 leading-tight">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Kerja akan dimulakan dalam masa 1-3 hari selepas bayaran disahkan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Sebarang pembatalan mestilah dibuat dalam tempoh 24 jam.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Kami menjamin kualiti kerja terbaik dan amanah untuk anda.</span>
              </li>
            </ul>
          </div>

          {/* WhatsApp Button - Only show for manual payment or cash */}
          {(!useBayarCash || paymentMethod === 'cash' || (paymentMethod === 'online' && !useBayarCash)) && (
            <>
              <Button
                variant="whatsapp"
                size="xl"
                className={`w-full gap-2 sm:gap-3 h-12 sm:h-14 text-base sm:text-lg transition-all duration-300 ${
                  paymentMethod === 'online' && !paymentConfirmed 
                    ? 'opacity-50 grayscale cursor-not-allowed' 
                    : 'shadow-whatsapp hover:scale-[1.02]'
                }`}
                onClick={handleWhatsAppClick}
                disabled={paymentMethod === 'online' && !paymentConfirmed}
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                {paymentMethod === 'cash' ? 'Sahkan Bayaran via WhatsApp' : 'Hantar Bukti via WhatsApp'}
              </Button>

              <p className="text-center text-[10px] sm:text-xs text-muted-foreground px-2">
                {paymentMethod === 'cash' 
                  ? 'Tekan butang di atas untuk memaklumkan admin tentang pilihan bayaran tunai anda'
                  : 'Setelah membuat pembayaran, sila hantar bukti pembayaran melalui WhatsApp'
                }
              </p>
            </>
          )}

          {/* Info for BayarCash users */}
          {useBayarCash && paymentMethod === 'online' && (
            <p className="text-center text-[10px] sm:text-xs text-muted-foreground px-2">
              Pembayaran melalui BayarCash adalah automatik. Anda akan menerima pengesahan selepas pembayaran berjaya.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
