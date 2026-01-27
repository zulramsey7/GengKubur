import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminGallery from "@/components/AdminGallery";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, LogOut, Eye, DollarSign, Calendar, Clock, FileText, Send, Download, Trash2, Search, Upload, Image as ImageIcon, BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
import Receipt from "@/components/Receipt";
import MusicSettings from "@/components/MusicSettings";

interface Booking {
  id: string;
  created_at: string;
  customer_name: string;
  phone_number: string;
  location: string;
  notes: string | null;
  package_name: string;
  package_price: number;
  status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  additional_items: { description: string; price: number }[] | null;
  admin_remarks: string | null;
  order_id: string;
  payment_balance: number | null;
}

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [paymentBalance, setPaymentBalance] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedBooking) {
      setAdminRemarks(selectedBooking.admin_remarks || "");
      setPaymentBalance(selectedBooking.payment_balance ? selectedBooking.payment_balance.toString() : "");
      
      const additionalItemsTotal = selectedBooking.additional_items?.reduce((sum, item) => sum + item.price, 0) || 0;
      const totalAmount = selectedBooking.package_price + additionalItemsTotal;

      let text = `*RESIT RASMI GENGKUBUR*
---------------------------
Tarikh: ${new Date().toLocaleDateString("ms-MY")}
No. Resit: ${selectedBooking.order_id}

*Butiran Pelanggan*
Nama: ${selectedBooking.customer_name}
No. Tel: ${selectedBooking.phone_number}

*Butiran Tempahan*
Pakej: ${selectedBooking.package_name}
Harga: RM ${selectedBooking.package_price}
`;

      if (selectedBooking.additional_items && selectedBooking.additional_items.length > 0) {
        text += `\n*Caj Tambahan*\n`;
        selectedBooking.additional_items.forEach(item => {
          text += `${item.description}: RM ${item.price}\n`;
        });
      }

      text += `
Jumlah Besar: RM ${totalAmount}
${(selectedBooking.payment_balance && selectedBooking.payment_balance > 0) ? `Baki Bayaran: RM ${selectedBooking.payment_balance}\n` : ''}Kaedah Bayaran: ${(selectedBooking.payment_method === 'cash' || selectedBooking.notes?.includes('(Bayaran: Tunai)')) ? 'Tunai' : 'Online Transfer'}
Lokasi: ${selectedBooking.location}
Catatan: ${selectedBooking.notes || "Tiada"}
${selectedBooking.admin_remarks ? `Catatan Admin: ${selectedBooking.admin_remarks}\n` : ''}
---------------------------
Terima kasih kerana memilih GengKubur!
Sebarang pertanyaan hubungi: 60173304906`;
      setReceiptText(text);
    }
  }, [selectedBooking]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    if (!file || !selectedBooking) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedBooking.order_id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'proof_of_work' bucket
      const { error: uploadError } = await supabase.storage
        .from('proof_of_work')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proof_of_work')
        .getPublicUrl(filePath);

      // Update Booking Record
      const updateData = type === 'before' 
        ? { before_photo_url: publicUrl }
        : { after_photo_url: publicUrl };

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', selectedBooking.id);

      if (updateError) throw updateError;

      // Update Local State
      const updatedBooking = { ...selectedBooking, ...updateData };
      setSelectedBooking(updatedBooking);
      setBookings(bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b));

      toast({
        title: "Berjaya",
        description: `Gambar ${type === 'before' ? 'sebelum' : 'selepas'} berjaya dimuat naik`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik gambar. Pastikan bucket 'proof_of_work' wujud dan public.",
        variant: "destructive",
      });
    }
  };

  const handleSavePaymentBalance = async () => {
    if (!selectedBooking) return;

    try {
      const balance = paymentBalance ? parseFloat(paymentBalance) : null;
      
      const { error } = await supabase
        .from('bookings')
        .update({ payment_balance: balance })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      const updatedBooking = { ...selectedBooking, payment_balance: balance };
      setSelectedBooking(updatedBooking);
      setBookings(bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b));

      toast({
        title: "Berjaya",
        description: "Baki bayaran berjaya dikemaskini",
      });
    } catch (error) {
      console.error('Error saving payment balance:', error);
      toast({
        title: "Error",
        description: "Gagal mengemaskini baki bayaran",
        variant: "destructive",
      });
    }
  };

  const handleSaveAdminRemarks = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ admin_remarks: adminRemarks })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      const updatedBooking = { ...selectedBooking, admin_remarks: adminRemarks };
      setSelectedBooking(updatedBooking);
      setBookings(bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b));

      toast({
        title: "Berjaya",
        description: "Catatan admin berjaya disimpan",
      });
    } catch (error) {
      console.error('Error saving admin remarks:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan catatan admin",
        variant: "destructive",
      });
    }
  };

  const handleAddAdditionalItem = async () => {
    if (!selectedBooking || !newItemDescription || !newItemPrice) return;

    const price = parseFloat(newItemPrice);
    if (isNaN(price)) {
      toast({
        title: "Ralat",
        description: "Sila masukkan harga yang sah",
        variant: "destructive",
      });
      return;
    }

    const newItem = { description: newItemDescription, price };
    const currentItems = selectedBooking.additional_items || [];
    const newItems = [...currentItems, newItem];

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ additional_items: newItems as any }) // Type assertion needed for JSONB
        .eq('id', selectedBooking.id);

      if (error) throw error;

      const updatedBooking = { ...selectedBooking, additional_items: newItems };
      setSelectedBooking(updatedBooking);
      setBookings(bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b));
      setNewItemDescription("");
      setNewItemPrice("");
      
      toast({
        title: "Berjaya",
        description: "Item tambahan berjaya ditambah",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Gagal menambah item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdditionalItem = async (index: number) => {
    if (!selectedBooking || !selectedBooking.additional_items) return;

    const newItems = [...selectedBooking.additional_items];
    newItems.splice(index, 1);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ additional_items: newItems as any })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      const updatedBooking = { ...selectedBooking, additional_items: newItems };
      setSelectedBooking(updatedBooking);
      setBookings(bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b));
      
      toast({
        title: "Berjaya",
        description: "Item tambahan berjaya dipadam",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Gagal memadam item",
        variant: "destructive",
      });
    }
  };

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

      setBookings((data as unknown as Booking[]) || []);
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

  const calculateTotal = (booking: Booking) => {
    const additional = booking.additional_items?.reduce((sum, item) => sum + item.price, 0) || 0;
    return booking.package_price + additional;
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

  const exportToCSV = () => {
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Location", "Package", "Price", "Status", "Total Amount"];
    const csvContent = [
      headers.join(","),
      ...bookings.map(b => [
        b.order_id,
        new Date(b.created_at).toLocaleDateString("ms-MY"),
        `"${b.customer_name}"`,
        b.phone_number,
        `"${b.location}"`,
        b.package_name,
        b.package_price,
        b.status,
        calculateTotal(b)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats Calculation
  const totalSales = bookings.reduce((sum, b) => sum + calculateTotal(b), 0);
  const totalOrders = bookings.length;
  const pendingOrders = bookings.filter(b => b.status === 'pending').length;
  const completedOrders = bookings.filter(b => b.status === 'completed').length;

  // Chart Data Preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayBookings = bookings.filter(b => b.created_at.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' }),
      sales: dayBookings.reduce((sum, b) => sum + calculateTotal(b), 0),
      orders: dayBookings.length
    };
  });

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
          <Button onClick={handleLogout} variant="destructive" className="flex-1 md:flex-none">
            <LogOut className="h-4 w-4 mr-2" />
            Log Keluar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Tempahan</TabsTrigger>
          <TabsTrigger value="gallery">Galeri</TabsTrigger>
          <TabsTrigger value="settings">Tetapan</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={fetchBookings} variant="outline" size="sm">
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Jualan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Keseluruhan masa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Tempahan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Keseluruhan masa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Perlu tindakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">Tempahan siap</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Jualan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Jualan']}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, order ID, atau no. tel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tapis Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="grid gap-4 md:hidden">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Tiada tempahan dijumpai
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
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
                    <p className="font-medium">RM {calculateTotal(booking).toFixed(2)}</p>
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
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  Tiada tempahan dijumpai
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
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
                  <TableCell>RM {calculateTotal(booking).toFixed(2)}</TableCell>
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
                  <ImageIcon className="h-4 w-4" />
                  Bukti Kerja (Gambar)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Gambar Sebelum</label>
                    <div className="border rounded-lg p-2 bg-muted/20 relative group min-h-[150px] flex items-center justify-center">
                      {selectedBooking.before_photo_url ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selectedBooking.before_photo_url}
                            alt="Sebelum"
                            className="w-full h-auto max-h-[200px] object-contain rounded-md"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async () => {
                              // Logic to remove photo
                              const { error } = await supabase.from('bookings').update({ before_photo_url: null }).eq('id', selectedBooking.id);
                              if (!error) {
                                const updated = { ...selectedBooking, before_photo_url: null };
                                setSelectedBooking(updated);
                                setBookings(bookings.map(b => b.id === selectedBooking.id ? updated : b));
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                          <label className="cursor-pointer">
                            <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                              Muat Naik
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'before')} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After Photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Gambar Selepas</label>
                    <div className="border rounded-lg p-2 bg-muted/20 relative group min-h-[150px] flex items-center justify-center">
                      {selectedBooking.after_photo_url ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selectedBooking.after_photo_url}
                            alt="Selepas"
                            className="w-full h-auto max-h-[200px] object-contain rounded-md"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async () => {
                              // Logic to remove photo
                              const { error } = await supabase.from('bookings').update({ after_photo_url: null }).eq('id', selectedBooking.id);
                              if (!error) {
                                const updated = { ...selectedBooking, after_photo_url: null };
                                setSelectedBooking(updated);
                                setBookings(bookings.map(b => b.id === selectedBooking.id ? updated : b));
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                          <label className="cursor-pointer">
                            <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                              Muat Naik
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'after')} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t pt-4">
                <h3 className="font-semibold mb-3">Item Tambahan (Admin)</h3>
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    {selectedBooking.additional_items && selectedBooking.additional_items.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {selectedBooking.additional_items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">{item.description}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">RM {item.price.toFixed(2)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteAdditionalItem(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4 text-center italic">Tiada item tambahan</p>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        placeholder="Keterangan item"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                      />
                      <input
                        placeholder="Harga (RM)"
                        type="number"
                        className="flex h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                      />
                      <Button onClick={handleAddAdditionalItem} size="sm">
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Baki Bayaran
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Masukkan baki bayaran jika pelanggan membayar deposit. Biarkan kosong jika tiada baki.
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="relative w-full max-w-[200px]">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">RM</span>
                      <Input
                        type="number"
                        value={paymentBalance}
                        onChange={(e) => setPaymentBalance(e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={handleSavePaymentBalance} size="sm" variant="secondary">
                      Simpan Baki
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t pt-4">
                <h3 className="font-semibold mb-3">Catatan Admin (Untuk Resit)</h3>
                <div className="space-y-2">
                  <Textarea
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="Masukkan catatan tambahan untuk resit..."
                    className="min-h-[80px]"
                  />
                  <Button onClick={handleSaveAdminRemarks} size="sm" variant="secondary" className="w-full">
                    Simpan Catatan
                  </Button>
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

      </TabsContent>

      <TabsContent value="gallery">
          <AdminGallery />
        </TabsContent>

        <TabsContent value="settings">
          <MusicSettings />
        </TabsContent>
      </Tabs>
      
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
