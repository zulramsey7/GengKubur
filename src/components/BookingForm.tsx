import { useState, useEffect, useRef } from "react";
import { User, Phone, MapPin, FileText, Plus, Check, AlertCircle, CheckCircle2, Upload, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookingDetails, Package, AdditionalItem } from "@/types/booking";
import { ProgressSteps } from "./ProgressSteps";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingFormProps {
  selectedPackage: Package | null;
  onSubmit: (details: BookingDetails) => void;
  initialDetails?: BookingDetails | null;
}

const ADDONS: AdditionalItem[] = [
  {
    id: 'flowers',
    name: 'Jambangan Bunga Segar',
    price: 50,
    description: 'Hiasan bunga segar di atas pusara'
  },
  {
    id: 'paint',
    name: 'Servis Cat Kepok',
    price: 150,
    description: 'Mengecat semula kepok kubur agar kelihatan baru'
  },
  {
    id: 'stones',
    name: 'Batu Sungai Putih',
    price: 50,
    description: 'Taburan batu sungai putih (1 bag)'
  },
  {
    id: 'maintenance',
    name: 'Servis Penyelenggaraan Tambahan',
    price: 80,
    description: 'Pembersihan detail & racun rumput extra'
  }
];

const BookingForm = ({ selectedPackage, onSubmit, initialDetails }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    customerName: initialDetails?.customerName || "",
    phoneNumber: initialDetails?.phoneNumber || "",
    location: initialDetails?.location || "",
    graveLotNumber: initialDetails?.graveLotNumber || "",
    notes: initialDetails?.notes || "",
  });

  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    initialDetails?.additionalItems?.map(item => {
      const addon = ADDONS.find(a => a.name === item.name);
      return addon?.id || "";
    }).filter(id => id !== "") || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>(
    initialDetails ? {
      customerName: true,
      phoneNumber: true,
      location: true,
      graveLotNumber: true,
      notes: true,
    } : {}
  );
  const [isUploading, setIsUploading] = useState(false);
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string>(initialDetails?.beforePhotoUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize errors if initialDetails exists
  useEffect(() => {
    if (initialDetails) {
      const initialErrors: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) initialErrors[key] = error;
      });
      setErrors(initialErrors);
    }
  }, []);

  // Reset addons when package changes (optional, but good for clean slate)
  useEffect(() => {
    // setSelectedAddons([]); 
    // Commented out to persist addons if user switches packages back and forth
  }, [selectedPackage]);

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "customerName":
        if (!value.trim()) error = "Sila masukkan nama";
        else if (value.trim().length < 3) error = "Nama terlalu pendek";
        break;
      case "phoneNumber":
        if (!value.trim()) error = "Sila masukkan nombor telefon";
        else {
          const cleanPhone = value.replace(/\D/g, "");
          if (cleanPhone.length < 10 || cleanPhone.length > 13) {
            error = "Nombor telefon tidak sah (min 10 digit)";
          } else if (!cleanPhone.startsWith("60")) {
            error = "Nombor telefon mesti bermula dengan 60";
          }
        }
        break;
      case "location":
        if (!value.trim()) error = "Sila masukkan lokasi kubur";
        break;
      case "graveLotNumber":
        if (!value.trim()) error = "Sila masukkan no lot kubur";
        break;
      case "notes":
        if (selectedPackage?.id === 'custom' && !value.trim()) {
          error = "Sila nyatakan keperluan anda";
        }
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (!selectedPackage) {
      newErrors.package = "Sila pilih pakej";
    }

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const selectedAddonItems = ADDONS.filter(addon => selectedAddons.includes(addon.id));
      
      onSubmit({
        ...formData,
        selectedPackage,
        additionalItems: selectedAddonItems,
        beforePhotoUrl: beforePhotoUrl || undefined,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format tidak sah",
        description: "Sila muat naik gambar sahaja",
        variant: "destructive",
      });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fail terlalu besar",
        description: "Saiz maksimum adalah 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `before_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `grave-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs') // Reusing the same bucket for simplicity, but in a different folder
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      setBeforePhotoUrl(publicUrl);
      toast({
        title: "Berjaya!",
        description: "Gambar kubur telah dimuat naik",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik gambar. Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    setBeforePhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (field: string, value: string) => {
    let finalValue = value;
    
    // Auto-format phone number
    if (field === "phoneNumber") {
      // Allow user to type, but clean up non-numeric
      const cleaned = value.replace(/\D/g, "");
      
      if (cleaned.startsWith("0")) {
        finalValue = "60" + cleaned.substring(1);
      } else if (cleaned.length > 0 && !cleaned.startsWith("60") && !cleaned.startsWith("6")) {
        finalValue = "60" + cleaned;
      } else {
        finalValue = cleaned;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    
    // Real-time validation
    const error = validateField(field, finalValue);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFieldValid = (field: string) => {
    return touched[field] && !errors[field] && formData[field as keyof typeof formData].trim() !== "";
  };

  const getFieldStatusIcon = (field: string) => {
    if (!touched[field]) return null;
    if (errors[field]) return <AlertCircle className="h-4 w-4 text-destructive animate-in zoom-in duration-300" />;
    if (formData[field as keyof typeof formData].trim() !== "") {
      return <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in duration-300" />;
    }
    return null;
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    const packagePrice = selectedPackage?.price || 0;
    const addonsPrice = ADDONS
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return packagePrice + addonsPrice;
  };

  return (
    <div className="max-w-2xl mx-auto px-1">
      <ProgressSteps currentStep={1} />
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <div className="space-y-5">
          {/* Customer Name */}
          <div className="relative group">
            <Label htmlFor="customerName" className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nama Penuh
              </div>
              {getFieldStatusIcon("customerName")}
            </Label>
            <div className="relative">
              <Input
                id="customerName"
                placeholder="Masukkan nama penuh anda"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                onBlur={() => handleBlur("customerName")}
                className={cn(
                  "h-14 pl-4 text-base transition-all duration-300 rounded-xl bg-muted/30 border-2",
                  errors.customerName && touched.customerName ? "border-destructive focus-visible:ring-destructive/20" : 
                  isFieldValid("customerName") ? "border-green-500 focus-visible:ring-green-500/20" :
                  "border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
                )}
              />
            </div>
            {errors.customerName && touched.customerName && (
              <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="h-3 w-3" /> {errors.customerName}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="relative group">
            <Label htmlFor="phoneNumber" className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Nombor Telefon
              </div>
              {getFieldStatusIcon("phoneNumber")}
            </Label>
            <div className="relative">
              <Input
                id="phoneNumber"
                placeholder="Contoh: 60123456789"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                onBlur={() => handleBlur("phoneNumber")}
                className={cn(
                  "h-14 pl-4 text-base transition-all duration-300 rounded-xl bg-muted/30 border-2",
                  errors.phoneNumber && touched.phoneNumber ? "border-destructive focus-visible:ring-destructive/20" : 
                  isFieldValid("phoneNumber") ? "border-green-500 focus-visible:ring-green-500/20" :
                  "border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
                )}
              />
            </div>
            {errors.phoneNumber && touched.phoneNumber && (
              <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="h-3 w-3" /> {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="relative group">
            <Label htmlFor="location" className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi Kubur
              </div>
              {getFieldStatusIcon("location")}
            </Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="Nama tanah perkuburan & lokasi"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                onBlur={() => handleBlur("location")}
                className={cn(
                  "h-14 pl-4 text-base transition-all duration-300 rounded-xl bg-muted/30 border-2",
                  errors.location && touched.location ? "border-destructive focus-visible:ring-destructive/20" : 
                  isFieldValid("location") ? "border-green-500 focus-visible:ring-green-500/20" :
                  "border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
                )}
              />
            </div>
            {errors.location && touched.location && (
              <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="h-3 w-3" /> {errors.location}
              </p>
            )}
          </div>

          {/* Grave Lot Number */}
          <div className="relative group">
            <Label htmlFor="graveLotNumber" className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                No Lot Kubur
              </div>
              {getFieldStatusIcon("graveLotNumber")}
            </Label>
            <div className="relative">
              <Input
                id="graveLotNumber"
                placeholder="Contoh: Lot 123, Blok A"
                value={formData.graveLotNumber}
                onChange={(e) => handleChange("graveLotNumber", e.target.value)}
                onBlur={() => handleBlur("graveLotNumber")}
                className={cn(
                  "h-14 pl-4 text-base transition-all duration-300 rounded-xl bg-muted/30 border-2",
                  errors.graveLotNumber && touched.graveLotNumber ? "border-destructive focus-visible:ring-destructive/20" : 
                  isFieldValid("graveLotNumber") ? "border-green-500 focus-visible:ring-green-500/20" :
                  "border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
                )}
              />
            </div>
            {errors.graveLotNumber && touched.graveLotNumber && (
              <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="h-3 w-3" /> {errors.graveLotNumber}
              </p>
            )}
          </div>

          {/* Grave Photo Upload (Before) */}
          <div className="relative group">
            <Label className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Gambar Kubur Sedia Ada (Pilihan)
              </div>
            </Label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {beforePhotoUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/30">
                <img 
                  src={beforePhotoUrl} 
                  alt="Pratonton Kubur" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-32 border-dashed border-2 rounded-xl bg-muted/20 hover:bg-primary/5 hover:border-primary/50 transition-all flex flex-col gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-medium text-muted-foreground tracking-wide">Sedang muat naik...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">Klik untuk muat naik gambar</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-tighter">Membantu petugas mencari lokasi dengan tepat</p>
                    </div>
                  </>
                )}
              </Button>
            )}
          </div>

        {/* Add-ons Section */}
        {selectedPackage?.id !== 'custom' && (
          <div className="mb-6">
            <Label className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4 text-primary" />
              Servis Tambahan (Add-on)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDONS.map((addon) => (
                <div 
                  key={addon.id}
                  className={`
                    relative flex items-start space-x-3 rounded-xl border p-3 cursor-pointer transition-all hover:border-primary/50
                    ${selectedAddons.includes(addon.id) ? 'border-primary bg-primary/5' : 'bg-white'}
                  `}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <div 
                    className={`
                      flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background
                      ${selectedAddons.includes(addon.id) ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
                    `}
                  >
                    {selectedAddons.includes(addon.id) && <Check className="h-3 w-3" />}
                  </div>
                  <div className="space-y-1">
                    <span 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {addon.name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {addon.description}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      +RM {addon.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="relative group">
          <Label htmlFor="notes" className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Catatan Tambahan
            </div>
            {getFieldStatusIcon("notes")}
          </Label>
          <Textarea
            id="notes"
            placeholder={
              selectedPackage?.id === 'custom' 
                ? "Sila nyatakan keperluan anda secara terperinci..." 
                : "Sebarang permintaan khusus..."
            }
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            className={cn(
              "min-h-[120px] text-base transition-all duration-300 rounded-xl bg-muted/30 border-2",
              errors.notes && touched.notes ? "border-destructive focus-visible:ring-destructive/20" : 
              isFieldValid("notes") ? "border-green-500 focus-visible:ring-green-500/20" :
              "border-transparent focus-visible:border-primary focus-visible:ring-primary/20"
            )}
          />
          {errors.notes && touched.notes && (
            <p className="mt-1.5 text-xs font-medium text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" /> {errors.notes}
            </p>
          )}
        </div>

        {/* Price Summary */}
        {selectedPackage?.id !== 'custom' && selectedPackage && (
          <div className="rounded-xl bg-muted/50 p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Harga Pakej ({selectedPackage.name})</span>
              <span className="font-medium">RM {selectedPackage.price}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-muted-foreground">Add-on Tambahan ({selectedAddons.length})</span>
                <span className="font-medium">
                  +RM {calculateTotal() - selectedPackage.price}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
              <span className="font-bold text-gray-900">Jumlah Anggaran</span>
              <span className="font-bold text-xl text-primary">RM {calculateTotal()}</span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full text-lg h-12">
          {selectedPackage?.id === 'custom' ? "Dapatkan Sebut Harga" : "Sahkan Tempahan"}
        </Button>
      </div>
      </form>
    </div>
  );
};

export default BookingForm;
