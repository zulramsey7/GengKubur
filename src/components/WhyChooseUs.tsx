import { ShieldCheck, Clock, Camera, Heart, UserCheck, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Amanah & Dipercayai",
    description: "Petugas kami terlatih dan menjaga adab serta kehormatan kawasan perkuburan."
  },
  {
    icon: Camera,
    title: "Laporan Bergambar",
    description: "Terima gambar 'Sebelum' dan 'Selepas' sebagai bukti tugasan telah dilaksanakan."
  },
  {
    icon: UserCheck,
    title: "Patuh Syariah",
    description: "Kaedah pembersihan yang mematuhi garis panduan dan adab menziarahi kubur."
  },
  {
    icon: Clock,
    title: "Tepat Masa",
    description: "Jadual pembersihan yang sistematik dan mengikut waktu yang dipersetujui."
  },
  {
    icon: Leaf,
    title: "Mesra Alam",
    description: "Penggunaan bahan pembersih yang selamat dan tidak merosakkan ekosistem."
  },
  {
    icon: Heart,
    title: "Khidmat Dari Hati",
    description: "Kami melakukan tugas ini bukan sekadar kerja, tetapi sebagai fardu kifayah."
  }
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary mb-4">
            Kenapa Pilih Kami?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kami komited memberikan perkhidmatan terbaik untuk memastikan pusara orang tersayang sentiasa terjaga rapi.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;