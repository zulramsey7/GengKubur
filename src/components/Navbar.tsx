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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? "text-foreground" : "text-white"}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? "text-foreground" : "text-white"}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg animate-in slide-in-from-top-5">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.id)}
                className="text-left text-sm font-medium py-2 hover:text-primary transition-colors"
              >
                {link.name}
              </button>
            ))}
            <Button 
              className="w-full gap-2 mt-2"
              onClick={() => {
                setIsOpen(false);
                navigate("/login");
              }}
            >
              <User className="h-4 w-4" />
              Login Admin
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
