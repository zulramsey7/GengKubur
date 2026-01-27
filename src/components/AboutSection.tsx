import { CheckCircle2 } from "lucide-react";

const AboutSection = () => {
  const features = [
    "Pembersihan rumput & lalang secara berkala",
    "Pencucian batu nisan & kepuk",
    "Jaminan kerja yang kemas & teliti",
    "Laporan bergambar sebelum & selepas",
    "Harga yang berpatutan & telus",
    "Khidmat pelanggan yang mesra"
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
              Tentang Kami
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Penyelenggaraan Kubur Yang Profesional & Amanah
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              GengKubur ditubuhkan dengan satu matlamat: memudahkan waris untuk memastikan pusara orang tersayang sentiasa dalam keadaan bersih dan terjaga. Kami memahami kekangan masa dan tenaga yang dihadapi, oleh itu kami hadir untuk membantu.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Dengan pasukan yang berpengalaman dan peralatan yang lengkap, kami menjanjikan hasil kerja yang memuaskan hati. Setiap tugasan dilakukan dengan penuh rasa tanggungjawab dan hormat.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-gray-200 relative z-10">
               {/* Placeholder for About Image - In a real app, use an actual image */}
               <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                 <span className="text-primary/40 font-bold text-xl">GengKubur Team</span>
               </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl z-0" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
