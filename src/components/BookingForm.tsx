import { useState } from "react";
import { User, Phone, MapPin, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookingDetails, Package } from "@/types/booking";

interface BookingFormProps {
  selectedPackage: Package | null;
  onSubmit: (details: BookingDetails) => void;
}

const BookingForm = ({ selectedPackage, onSubmit }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    location: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      onSubmit({
        ...formData,
        selectedPackage,
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Maklumat Tempahan
            </h2>
            <p className="text-muted-foreground">
              Sila lengkapkan butiran di bawah untuk meneruskan tempahan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-card">
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

              {/* Notes */}
              <div className="mb-6">
                <Label htmlFor="notes" className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  {selectedPackage?.id === 'custom' ? 'Nyatakan Keperluan Anda (Wajib)' : 'Catatan Tambahan (Pilihan)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={selectedPackage?.id === 'custom' ? "Sila nyatakan servis yang anda perlukan..." : "Maklumat tambahan jika ada..."}
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className={errors.notes ? "border-destructive" : ""}
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-destructive">{errors.notes}</p>
                )}
              </div>

              {/* Selected Package Summary */}
              {selectedPackage && (
                <div className="mb-6 rounded-xl bg-primary/5 p-4 border border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground">Pakej Dipilih:</p>
                  <p className="text-lg font-bold text-primary">
                    {selectedPackage.name} - {selectedPackage.price === 0 ? "Harga akan dikira oleh admin" : `RM ${selectedPackage.price}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                </div>
              )}

              {errors.package && (
                <p className="mb-4 text-sm text-destructive">{errors.package}</p>
              )}

              {/* Submit Button */}
              <Button type="submit" variant="hero" size="xl" className="w-full">
                {selectedPackage?.id === 'custom' ? 'Hantar Permintaan Sebut Harga' : 'Teruskan ke Pembayaran'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
