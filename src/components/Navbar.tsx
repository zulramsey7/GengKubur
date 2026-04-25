import { useState, useEffect } from "react";
import { Menu, X, Leaf, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { NotificationPermission } from "./NotificationPermission";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navLinks = [
    { name: "Laman Utama", id: "hero" },
    { name: "Pakej", id: "packages" },
    { name: "Perihal", id: "about" },
    { name: "Galeri", id: "gallery" },
    { name: "FAQ", id: "faq" },
    { name: "Hubungi Kami", id: "contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => scrollToSection("hero")}
            >
              <div className={`rounded-full p-2 transition-colors ${isScrolled ? "bg-primary/10" : "bg-white/20"}`}>
                <Leaf className={`h-5 w-5 ${isScrolled ? "text-primary" : "text-white"}`} />
              </div>
              <span className={`text-xl font-bold ${isScrolled ? "text-foreground" : "text-white"}`}>
                GengKubur
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isScrolled ? "text-muted-foreground" : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.name}
                </button>
              ))}
              <NotificationPermission isScrolled={isScrolled} />
              <Button 
                variant={isScrolled ? "default" : "secondary"}
                size="sm"
                className="gap-2"
                onClick={() => navigate("/login")}
              >
                <User className="h-4 w-4" />
                Login Admin
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 relative z-[70]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className={`h-6 w-6 ${isScrolled || isOpen ? "text-foreground" : "text-white"}`} />
              ) : (
                <Menu className={`h-6 w-6 ${isScrolled ? "text-foreground" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Sidebar - Outside nav for higher z-index context */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-foreground/40 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-[300px] bg-background shadow-2xl animate-in slide-in-from-right duration-300 border-l border-primary/10 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-2">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-primary text-lg">GengKubur</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1 p-4 overflow-y-auto flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Navigasi Utama</p>
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className="flex items-center text-left text-lg font-medium px-4 py-4 rounded-xl hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                >
                  {link.name}
                </button>
              ))}
              
              <div className="mt-8 pt-8 border-t border-muted px-2 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Notifikasi</p>
                    <p className="text-xs text-muted-foreground">Makluman terkini</p>
                  </div>
                  <NotificationPermission isScrolled={true} />
                </div>
                
                <Button 
                  variant="hero"
                  className="w-full gap-2 h-14 text-lg rounded-2xl shadow-lg"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/login");
                  }}
                >
                  <User className="h-5 w-5" />
                  Login Admin
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground mt-4 pb-4">
                  © 2026 GengKubur Planner. Semua Hak Cipta Terpelihara.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
