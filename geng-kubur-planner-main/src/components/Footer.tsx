import { Leaf, Phone, Mail, MapPin, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary-foreground/20 p-2">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">GengKubur</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Perkhidmatan penyelenggaraan kubur yang profesional dan amanah. 
              Kami sentiasa komited untuk memberikan perkhidmatan terbaik.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Hubungi Kami</h3>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" />
                <span>017-3304906</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span>gengkubur@email.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                <span>Ampang,Selangor, Malaysia</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold mb-4">Waktu Operasi</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <p>Isnin - Jumaat: 8:00 AM - 6:00 PM</p>
              <p>Sabtu: 8:00 AM - 1:00 PM</p>
              <p>Ahad: Tutup</p>
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
