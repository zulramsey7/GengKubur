import { Leaf } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-3 animate-fade-in">
            <div className="rounded-full bg-primary-foreground/20 p-4">
              <Leaf className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl animate-slide-up">
            GengKubur
          </h1>

          {/* Tagline */}
          <p className="mb-8 max-w-2xl text-lg text-primary-foreground/90 md:text-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Perkhidmatan Penyelenggaraan Kubur Profesional & Amanah
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground">
              ✓ Dipercayai
            </div>
            <div className="rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground">
              ✓ Harga Berpatutan
            </div>
            <div className="rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground">
              ✓ Kerja Berkualiti
            </div>
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(60, 30%, 96%)"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
