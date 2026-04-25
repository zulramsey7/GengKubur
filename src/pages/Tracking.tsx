import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, User, MapPin, Calendar, CheckCircle2, Clock, XCircle, Image as ImageIcon, ArrowLeft, Download, Camera, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Receipt from "@/components/Receipt";

interface TrackingResult {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  package_name: string;
  package_price: number;
  location: string;
  created_at: string;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  additional_items: { description: string; price: number }[] | null;
  admin_remarks: string | null;
  payment_balance: number | null;
  phone_number: string;
}

const Tracking = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    
    if (mode === "staff") {
      setIsStaffMode(true);
    }
    
    if (id) {
      setOrderId(id);
      // Auto search if ID is provided in URL
      const performAutoSearch = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .ilike('order_id', id)
            .maybeSingle();

          if (data) {
            setResult({
              ...data,
              additional_items: data.additional_items as any,
            });
          }
        } catch (err) {
          console.error('Auto search error:', err);
        } finally {
          setLoading(false);
        }
      };
      performAutoSearch();
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast({
        title: "Ralat",
        description: "Sila masukkan Order ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const cleanOrderId = orderId.trim();
    console.log('Searching for Order ID:', cleanOrderId);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .ilike('order_id', cleanOrderId)
        .maybeSingle();

      console.log('Search Result:', { data, error });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Tidak Dijumpai",
          description: "Tiada tempahan dijumpai dengan Order ID tersebut.",
          variant: "destructive",
        });
      } else {
        // Transform the data to match TrackingResult/Receipt expected structure
        const bookingData: TrackingResult = {
          ...data,
          additional_items: data.additional_items as any, // Cast JSON to expected type
        };
        setResult(bookingData);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        title: "Ralat",
        description: "Berlaku ralat semasa membuat carian.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file || !result) return;

    const setUploading = type === 'before' ? setIsUploadingBefore : setIsUploadingAfter;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${result.order_id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proof_of_work')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('proof_of_work')
        .getPublicUrl(filePath);

      const updateData = type === 'before' 
        ? { before_photo_url: publicUrl } 
        : { after_photo_url: publicUrl };

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', result.id);

      if (updateError) throw updateError;

      setResult({ ...result, ...updateData });
      
      toast({
        title: "Berjaya",
        description: `Gambar ${type === 'before' ? 'sebelum' : 'selepas'} dikemaskini`,
      });
    } catch (error) {
      console.error('Error uploading staff photo:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik gambar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStaffStatusUpdate = async (newStatus: string) => {
    if (!result) return;
    setIsUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', result.id);

      if (error) throw error;

      setResult({ ...result, status: newStatus });
      
      toast({
        title: "Status Dikemaskini",
        description: `Status tempahan telah ditukar kepada ${getStatusText(newStatus)}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !result) return;

    try {
      toast({
        title: "Menjana Resit PDF",
        description: "Sila tunggu sebentar...",
      });

      // Wait a bit for any fonts/images to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        windowWidth: 794,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Resit_GengKubur_${result.order_id}.pdf`);
      
      toast({
        title: "Berjaya",
        description: "Resit PDF telah dimuat turun",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Gagal menjana PDF. Sila cuba lagi.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500 hover:bg-yellow-600";
      case "confirmed": return "bg-blue-500 hover:bg-blue-600";
      case "completed": return "bg-green-500 hover:bg-green-600";
      case "cancelled": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-5 w-5" />;
      case "confirmed": return <CheckCircle2 className="h-5 w-5" />;
      case "completed": return <CheckCircle2 className="h-5 w-5" />;
      case "cancelled": return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu Pengesahan";
      case "confirmed": return "Disahkan & Dalam Proses";
      case "completed": return "Siap Sepenuhnya";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-primary hover:bg-transparent pl-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Halaman Utama
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isStaffMode ? "Portal Petugas (Staff)" : "Semakan Status Tempahan"}
          </h1>
          <p className="text-gray-600">
            {isStaffMode 
              ? "Sila kemaskini bukti kerja dan status tugasan di sini." 
              : "Masukkan Order ID anda untuk menyemak status terkini dan bukti kerja."}
          </p>
        </div>

        <Card className="w-full shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Contoh: GK-L4X5Y6Z-1A2B"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button type="submit" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Menyemak..." : "Semak Status"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <Card className="border-t-4 border-t-primary shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {result.package_name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Order ID: {result.order_id}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={`${getStatusColor(result.status)} text-white px-4 py-1.5 text-sm flex items-center gap-2`}>
                      {getStatusIcon(result.status)}
                      {getStatusText(result.status)}
                    </Badge>
                    
                    {isStaffMode && result.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold w-full sm:w-auto"
                        onClick={() => handleStaffStatusUpdate('completed')}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Tanda Siap Sepenuhnya
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 text-xs w-full sm:w-auto"
                      onClick={handleDownloadPDF}
                    >
                      <Download className="h-3 w-3" />
                      Muat Turun Resit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nama Pelanggan</p>
                      <p className="font-medium">{result.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lokasi Kubur</p>
                      <p className="font-medium">{result.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tarikh Tempahan</p>
                      <p className="font-medium">{new Date(result.created_at).toLocaleDateString("ms-MY")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photo */}
              <Card className="shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50 border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <ImageIcon className="h-4 w-4" />
                    Sebelum Pembersihan
                  </CardTitle>
                  {isStaffMode && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={beforeFileInputRef}
                        onChange={(e) => handleStaffPhotoUpload(e, 'before')}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-primary"
                        onClick={() => beforeFileInputRef.current?.click()}
                        disabled={isUploadingBefore}
                      >
                        {isUploadingBefore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {result.before_photo_url ? (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100 relative group">
                      <img
                        src={result.before_photo_url}
                        alt="Sebelum"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2">
                      <ImageIcon className="h-8 w-8 opacity-20" />
                      <p className="text-xs italic font-medium">Tiada gambar sebelum</p>
                      {isStaffMode && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-[10px] h-7"
                          onClick={() => beforeFileInputRef.current?.click()}
                        >
                          Upload Gambar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* After Photo */}
              <Card className="shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50 border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <ImageIcon className="h-4 w-4" />
                    Selepas Pembersihan
                  </CardTitle>
                  {isStaffMode && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={afterFileInputRef}
                        onChange={(e) => handleStaffPhotoUpload(e, 'after')}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-primary"
                        onClick={() => afterFileInputRef.current?.click()}
                        disabled={isUploadingAfter}
                      >
                        {isUploadingAfter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {result.after_photo_url ? (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100 relative group">
                      <img
                        src={result.after_photo_url}
                        alt="Selepas"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2">
                      <ImageIcon className="h-8 w-8 opacity-20" />
                      <p className="text-xs italic font-medium">Tiada gambar selepas</p>
                      {isStaffMode && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-[10px] h-7"
                          onClick={() => afterFileInputRef.current?.click()}
                        >
                          Upload Gambar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Hidden Receipt Template */}
        {result && (
          <div className="absolute left-[-9999px] top-0">
            <Receipt ref={receiptRef} booking={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;