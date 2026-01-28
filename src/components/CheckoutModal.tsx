import { useState, useRef } from "react";
import { X, Copy, Check, MessageCircle, QrCode, Calendar, User, MapPin, Package, Upload, Image, Loader2, CreditCard, Banknote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderSummary } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutModalProps {
  order: OrderSummary;
  onClose: () => void;
  qrImageUrl: string;
  whatsappNumber: string;
}

const CheckoutModal = ({ order, onClose, qrImageUrl, whatsappNumber }: CheckoutModalProps) => {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    toast({
      title: "Disalin!",
      description: "ID Tempahan telah disalin ke papan keratan",
    });
    setTimeout(() => setCopied(false), 2000);
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

      // Update booking with payment proof
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          payment_proof_url: publicUrl,
          payment_method: 'online',
          // Optional: update status to 'paid' or similar if you have such status
        })
        .eq('order_id', order.orderId);

      if (updateError) throw updateError;

      setUploadedProof(publicUrl);
      
      toast({
        title: "Berjaya!",
        description: "Bukti pembayaran telah dimuat naik dan disimpan",
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

📦 *Pakej Dipilih:*
${order.selectedPackage?.name} - ${order.selectedPackage?.description}${addonsText}

💰 *Jumlah Bayaran:* RM ${order.totalAmount}
💳 *Kaedah Bayaran:* ${paymentMethod === 'online' ? 'Online Transfer / QR' : 'Tunai (Cash)'}

${order.notes ? `📝 *Catatan:* ${order.notes}` : ""}

${paymentMethod === 'online' && uploadedProof ? `📸 *Bukti Pembayaran:* Telah dimuat naik` : ""}

Terima kasih kerana memilih GengKubur! 🙏`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = async () => {
    try {
      // Fetch current notes first
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('notes')
        .eq('order_id', order.orderId)
        .single();

      const updates: any = { payment_method: paymentMethod };
      const cashNote = '(Bayaran: Tunai)';

      if (currentBooking) {
        let newNotes = currentBooking.notes || '';
        
        if (paymentMethod === 'cash') {
          if (!newNotes.includes(cashNote)) {
            newNotes = newNotes ? `${newNotes} ${cashNote}` : cashNote;
          }
        } else {
          // Remove if exists
          newNotes = newNotes.replace(cashNote, '').trim();
        }
        
        if (newNotes !== currentBooking.notes) {
          updates.notes = newNotes;
        }
      }

      // Update payment method and notes
      await supabase
        .from('bookings')
        .update(updates)
        .eq('order_id', order.orderId);

      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
      const message = generateWhatsAppMessage();
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    } catch (error) {
      console.error('Error updating payment method:', error);
      // Still open WhatsApp even if update fails
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
      const message = generateWhatsAppMessage();
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-hover animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-foreground">Checkout & Pembayaran</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order ID */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4 border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground">ID Tempahan</p>
              <p className="font-mono text-lg font-bold text-primary">{order.orderId}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyOrderId}
              className="h-10 w-10"
            >
              {copied ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Butiran Tempahan</h3>
            
            <div className="space-y-2 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Nama:</span>
                <span className="font-medium text-foreground">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Lokasi:</span>
                <span className="font-medium text-foreground">{order.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Pakej:</span>
                <span className="font-medium text-foreground">{order.selectedPackage?.name}</span>
              </div>
              
              {/* Add-ons Display */}
              {order.additionalItems && order.additionalItems.length > 0 && (
                <div className="flex items-start gap-3 text-sm pt-2 border-t border-muted-foreground/20 mt-2">
                   <Plus className="h-4 w-4 text-primary mt-0.5" />
                   <div className="flex-1">
                     <span className="text-muted-foreground block mb-1">Add-on:</span>
                     <ul className="space-y-1">
                       {order.additionalItems.map((item, idx) => (
                         <li key={idx} className="font-medium text-foreground flex justify-between">
                           <span>{item.name}</span>
                           <span>RM {item.price}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Tarikh:</span>
                <span className="font-medium text-foreground">{order.orderDate}</span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="rounded-xl bg-gradient-hero p-4 text-center">
            <p className="text-sm text-primary-foreground/80">Jumlah Bayaran</p>
            <p className="text-3xl font-bold text-primary-foreground">RM {order.totalAmount}</p>
          </div>

          <Tabs defaultValue="online" onValueChange={(v) => setPaymentMethod(v as "online" | "cash")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="online" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Online / QR
              </TabsTrigger>
              <TabsTrigger value="cash" className="gap-2">
                <Banknote className="h-4 w-4" />
                Tunai (Cash)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="space-y-6">
              {/* Bank Details */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Maklumat Bank
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">Maybank</span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 pb-2">
                    <span className="text-muted-foreground">Nama Akaun</span>
                    <span className="font-medium text-right">ZULFIKAR BIN AZIZUL</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">No. Akaun</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">164810189215</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText("164810189215");
                          toast({ title: "Disalin!", description: "No. Akaun disalin" });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Imbas QR untuk Pembayaran</h3>
                </div>
                
                <div className="mx-auto w-48 h-48 rounded-xl border-4 border-primary/20 bg-card p-2 shadow-card">
                  <img
                    src={qrImageUrl}
                    alt="QR Code Pembayaran"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Imbas kod QR di atas menggunakan aplikasi perbankan anda
                </p>
              </div>

              {/* Payment Proof Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Muat Naik Bukti Pembayaran</h3>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {uploadedProof ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-full max-w-xs rounded-xl border-2 border-primary/30 bg-muted/30 p-2 overflow-hidden">
                      <img
                        src={uploadedProof}
                        alt="Bukti Pembayaran"
                        className="w-full h-auto rounded-lg object-contain max-h-48"
                      />
                      <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Tukar Gambar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Memuat naik...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Klik untuk muat naik bukti pembayaran</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cash" className="py-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Bayaran Tunai</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Sila buat pembayaran tunai secara terus kepada petugas kami di lokasi atau semasa perjumpaan.
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-left max-w-sm mx-auto">
                  <p className="font-semibold mb-2">Nota:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Sila sediakan wang secukupnya jika boleh.</li>
                    <li>Resit rasmi akan dikeluarkan selepas bayaran diterima.</li>
                    <li>Tekan butang WhatsApp di bawah untuk maklumkan kepada admin.</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* WhatsApp Button */}
          <Button
            variant="whatsapp"
            size="xl"
            className="w-full gap-3"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="h-6 w-6" />
            {paymentMethod === 'cash' ? 'Sahkan Bayaran Tunai via WhatsApp' : 'Hantar Bukti & Resit via WhatsApp'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {paymentMethod === 'cash' 
              ? 'Tekan butang di atas untuk memaklumkan admin tentang pilihan bayaran tunai anda'
              : 'Setelah membuat pembayaran, sila hantar bukti pembayaran melalui WhatsApp'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
