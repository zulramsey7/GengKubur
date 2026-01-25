import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Receipt from "@/components/Receipt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, LogOut, Eye, DollarSign, Calendar, Clock, FileText, Send, Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  created_at: string;
  customer_name: string;
  phone_number: string;
  location: string;
  notes: string;
  package_name: string;
  package_price: number;
  status: string;
  payment_proof_url: string | null;
  order_id: string;
}

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedBooking) {
      const text = `*RESIT RASMI GENGKUBUR*
---------------------------
Tarikh: ${new Date().toLocaleDateString("ms-MY")}
No. Resit: ${selectedBooking.order_id}

*Butiran Pelanggan*
Nama: ${selectedBooking.customer_name}
No. Tel: ${selectedBooking.phone_number}

*Butiran Tempahan*
Pakej: ${selectedBooking.package_name}
Harga: RM ${selectedBooking.package_price}
Lokasi: ${selectedBooking.location}
Catatan: ${selectedBooking.notes || "Tiada"}

---------------------------
Terima kasih kerana memilih GengKubur!
Sebarang pertanyaan hubungi: 60173304906`;
      setReceiptText(text);
    }
  }, [selectedBooking]);

  const handleSendWhatsApp = () => {
    if (!selectedBooking) return;
    
    let phone = selectedBooking.phone_number.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '60' + phone.slice(1);
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(receiptText)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !selectedBooking) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Resit-${selectedBooking.order_id}.pdf`);
      
      toast({
        title: "Berjaya",
        description: "Resit PDF berjaya dimuat turun",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Gagal menjana PDF",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Gagal memuatkan senarai tempahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      
      toast({
        title: "Berjaya",
        description: "Status tempahan dikemaskini",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Gagal mengemaskini status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-500 hover:bg-green-600';
      case 'completed': return 'bg-blue-500 hover:bg-blue-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(bookings.filter(b => b.id !== id));
      if (selectedBooking?.id === id) setSelectedBooking(null);
      
      toast({
        title: "Berjaya",
        description: "Tempahan telah dipadam",
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Gagal memadam tempahan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Uruskan tempahan dan pelanggan anda
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <Button onClick={fetchBookings} variant="outline" className="flex-1 md:flex-none">
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="flex-1 md:flex-none">
            <LogOut className="h-4 w-4 mr-2" />
            Log Keluar
          </Button>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="grid gap-4 md:hidden">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Tiada tempahan dijumpai
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      #{booking.order_id.slice(-6)}
                      <Badge variant="outline" className="font-normal text-xs">
                        {new Date(booking.created_at).toLocaleDateString("ms-MY")}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm font-medium mt-1">{booking.customer_name}</p>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Pakej</span>
                    <p className="font-medium">{booking.package_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Harga</span>
                    <p className="font-medium">RM {booking.package_price}</p>
                  </div>
                </div>
                
                {booking.payment_proof_url && (
                  <div className="pt-2">
                    <span className="text-muted-foreground text-xs block mb-1">Bukti Bayaran</span>
                    <a 
                      href={booking.payment_proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Lihat Resit
                    </a>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between gap-2 border-t mt-2">
                  <Select 
                    defaultValue={booking.status} 
                    onValueChange={(value) => updateStatus(booking.id, value)}
                  >
                    <SelectTrigger className="h-9 w-[110px] text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => setSelectedBooking(booking)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] rounded-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Padam Tempahan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini kekal. Tempahan #{booking.order_id} akan dipadam.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-2 justify-end">
                          <AlertDialogCancel className="mt-0">Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBooking(booking.id)} className="bg-red-500 hover:bg-red-600">
                            Padam
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="rounded-md border hidden md:block bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Pakej</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bukti Bayaran</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  Tiada tempahan dijumpai
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono">{booking.order_id}</TableCell>
                  <TableCell>
                    {new Date(booking.created_at).toLocaleDateString("ms-MY")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{booking.customer_name}</span>
                      <span className="text-xs text-muted-foreground">{booking.phone_number}</span>
                      <span className="text-xs text-muted-foreground">{booking.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{booking.package_name}</TableCell>
                  <TableCell>RM {booking.package_price}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.payment_proof_url ? (
                      <a 
                        href={booking.payment_proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:underline text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Lihat
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        defaultValue={booking.status} 
                        onValueChange={(value) => updateStatus(booking.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Adakah anda pasti?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak boleh dibatalkan. Ini akan memadam tempahan {booking.order_id} secara kekal dari pangkalan data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBooking(booking.id)} className="bg-red-500 hover:bg-red-600">
                              Padam
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle>Butiran Tempahan</DialogTitle>
            <DialogDescription>
              ID: {selectedBooking?.order_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Maklumat Pelanggan
                    </h3>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">Nama:</span>
                        <span className="font-medium">{selectedBooking.customer_name}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">No. Tel:</span>
                        <span className="font-medium">{selectedBooking.phone_number}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">Lokasi:</span>
                        <span className="font-medium">{selectedBooking.location}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Maklumat Pakej</h3>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">Pakej:</span>
                        <span className="font-medium">{selectedBooking.package_name}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">Harga:</span>
                        <span className="font-medium">RM {selectedBooking.package_price}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-muted-foreground">Tarikh:</span>
                        <span className="font-medium">{new Date(selectedBooking.created_at).toLocaleDateString("ms-MY")}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(selectedBooking.status) + " w-fit"}>{selectedBooking.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Catatan</h3>
                    <p className="text-sm bg-muted p-3 rounded-lg min-h-[80px]">
                      {selectedBooking.notes || "Tiada catatan"}
                    </p>
                  </div>

                  {selectedBooking.payment_proof_url && (
                    <div>
                      <h3 className="font-semibold mb-2">Bukti Pembayaran</h3>
                      <div className="border rounded-lg p-2 bg-muted/20 relative group">
                        <img 
                          src={selectedBooking.payment_proof_url}
                          alt="Bukti Pembayaran"
                          className="w-full h-auto max-h-[200px] object-contain rounded-md cursor-pointer hover:opacity-95 transition-opacity bg-white"
                          onClick={() => window.open(selectedBooking.payment_proof_url!, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = "https://placehold.co/600x400?text=Gambar+Tidak+Dijumpai";
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Button size="sm" variant="secondary" className="h-8 text-xs shadow-sm" onClick={() => window.open(selectedBooking.payment_proof_url!, '_blank')}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Buka
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Penjanaan Resit
                </h3>
                <div className="space-y-4">
                  <Textarea 
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                    placeholder="Teks resit akan dipaparkan di sini..."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handleSendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Send className="h-4 w-4 mr-2" />
                      Hantar WhatsApp
                    </Button>
                    <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Muat Turun PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Hidden Receipt Template for PDF Generation */}
      {selectedBooking && (
        <div className="absolute left-[-9999px] top-0">
          <Receipt ref={receiptRef} booking={selectedBooking} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
