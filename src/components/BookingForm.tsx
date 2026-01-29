import { useState, useEffect } from "react";
import { User, Phone, MapPin, FileText, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookingDetails, Package, AdditionalItem } from "@/types/booking";

interface BookingFormProps {
  selectedPackage: Package | null;
  onSubmit: (details: BookingDetails) => void;
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

const BookingForm = ({ selectedPackage, onSubmit }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    location: "",
    notes: "",
  });

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset addons when package changes (optional, but good for clean slate)
  useEffect(() => {
    // setSelectedAddons([]); 
    // Commented out to persist addons if user switches packages back and forth
  }, [selectedPackage]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Sila masukkan nama";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Sila masukkan nombor telefon";
    } else if (!/^[0-9+\-\s]{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Nombor telefon tidak sah";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Sila masukkan lokasi kubur";
    }

    if (selectedPackage?.id === 'custom' && !formData.notes.trim()) {
      newErrors.notes = "Sila nyatakan keperluan anda";
    }

    if (!selectedPackage) {
      newErrors.package = "Sila pilih pakej";
    }

    setErrors(newErrors);
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
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Customer Name */}
        <div className="mb-6">
          <Label htmlFor="customerName" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-primary" />
            Nama Penuh
          </Label>
          <Input
            id="customerName"
            placeholder="Masukkan nama penuh anda"
            value={formData.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            className={errors.customerName ? "border-destructive" : ""}
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-destructive">{errors.customerName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <Label htmlFor="phoneNumber" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-primary" />
            Nombor Telefon
          </Label>
          <Input
            id="phoneNumber"
            placeholder="Contoh: 012-3456789"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className={errors.phoneNumber ? "border-destructive" : ""}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-destructive">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Location */}
        <div className="mb-6">
          <Label htmlFor="location" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Lokasi Kubur
          </Label>
          <Input
            id="location"
            placeholder="Nama tanah perkuburan & lokasi"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className={errors.location ? "border-destructive" : ""}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-destructive">{errors.location}</p>
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
        <div className="mb-6">
          <Label htmlFor="notes" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Catatan Tambahan
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
            className={`min-h-[100px] ${errors.notes ? "border-destructive" : ""}`}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-destructive">{errors.notes}</p>
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
  );
};

export default BookingForm;
