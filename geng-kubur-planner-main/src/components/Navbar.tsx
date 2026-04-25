import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="text-xl font-bold text-primary cursor-pointer" onClick={() => scrollToSection("hero")}>
            Geng Kubur
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("about")}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Perihal
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Galeri
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Hubungi
            </button>
            <Button onClick={() => scrollToSection("packages")}>Tempah Sekarang</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <button
              onClick={() => scrollToSection("about")}
              className="text-left text-gray-600 hover:text-primary"
            >
              Perihal
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className="text-left text-gray-600 hover:text-primary"
            >
              Galeri
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-left text-gray-600 hover:text-primary"
            >
              Hubungi
            </button>
            <Button onClick={() => scrollToSection("packages")} className="w-full">
              Tempah Sekarang
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
