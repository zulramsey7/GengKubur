import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, User, MapPin, Calendar, CheckCircle2, Clock, XCircle, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface TrackingResult {
  id: string;
  order_id: string;
  status: string;
  customer_name: string;
  package_name: string;
  location: string;
  created_at: string;
  before_photo_url: string | null;
  after_photo_url: string | null;
}

const Tracking = () => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // Search by Order ID or Phone Number
      const { data, error } = await supabase
        .from('bookings')
        .select('id, order_id, status, customer_name, package_name, location, created_at, before_photo_url, after_photo_url')
        .or(`order_id.ilike.%${cleanOrderId}%,phone_number.ilike.%${cleanOrderId}%`)
        .order('created_at', { ascending: false })
        .limit(1)
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
        setResult(data as TrackingResult);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Semakan Status Tempahan</h1>
          <p className="text-gray-600">Masukkan Order ID anda untuk menyemak status terkini dan bukti kerja.</p>
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
                  <Badge className={`${getStatusColor(result.status)} text-white px-4 py-1.5 text-sm flex items-center gap-2`}>
                    {getStatusIcon(result.status)}
                    {getStatusText(result.status)}
                  </Badge>
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
            {(result.before_photo_url || result.after_photo_url) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-500" />
                      Sebelum
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {result.before_photo_url ? (
                      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                        <img 
                          src={result.before_photo_url} 
                          alt="Keadaan Sebelum" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">Tiada gambar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                      <ImageIcon className="h-5 w-5" />
                      Selepas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {result.after_photo_url ? (
                      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                        <img 
                          src={result.after_photo_url} 
                          alt="Keadaan Selepas" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">Tiada gambar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {result.status === 'completed' && !result.after_photo_url && (
               <Card className="bg-blue-50 border-blue-200">
                 <CardContent className="py-4 flex items-center gap-3">
                   <div className="bg-blue-100 p-2 rounded-full">
                     <ImageIcon className="h-5 w-5 text-blue-600" />
                   </div>
                   <p className="text-sm text-blue-800">
                     Gambar bukti kerja akan dimuat naik oleh admin setelah kerja selesai. Sila semak semula nanti.
                   </p>
                 </CardContent>
               </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
