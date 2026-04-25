import { Leaf, Phone, Mail, MapPin, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 text-center md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary-foreground/20 p-2">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">GengKubur</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              Perkhidmatan penyelenggaraan kubur yang profesional dan amanah. 
              Kami sentiasa komited untuk memberikan perkhidmatan terbaik.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-4 text-lg">Hubungi Kami</h3>
            <div className="space-y-4 text-sm text-primary-foreground/80 w-full max-w-xs">
              <a 
                href="https://wa.me/60173304906?text=Salam%20GengKubur%2C%20saya%20ada%20pertanyaan." 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-3 hover:text-white transition-colors p-3 bg-white/10 rounded-xl md:bg-transparent md:p-0"
              >
                <Phone className="h-5 w-5 shrink-0" />
                <span className="text-base md:text-sm font-medium">017-3304906 (WhatsApp)</span>
              </a>
              <div className="flex items-center justify-center md:justify-start gap-3 p-3 bg-white/10 rounded-xl md:bg-transparent md:p-0">
                <Mail className="h-5 w-5 shrink-0" />
                <span className="text-base md:text-sm font-medium">gengkubur@gmail.com</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 p-3 bg-white/10 rounded-xl md:bg-transparent md:p-0 text-center md:text-left">
                <MapPin className="h-5 w-5 shrink-0" />
                <span className="text-base md:text-sm font-medium">Ampang, Selangor, Malaysia</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-4 text-lg">Waktu Operasi</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <p className="text-base md:text-sm font-medium">Isnin - Jumaat: 8:00 AM - 6:00 PM</p>
              <p className="text-base md:text-sm font-medium">Sabtu: 8:00 AM - 1:00 PM</p>
              <p className="text-base md:text-sm font-medium">Ahad: Tutup</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>© 2026 GengKubur. Hak Cipta Terpelihara.</p>
          <Link to="/admin" className="flex items-center gap-2 hover:text-primary-foreground transition-colors">
            <Lock className="h-3 w-3" />
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
