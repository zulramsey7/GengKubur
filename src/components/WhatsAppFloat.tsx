import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  const phoneNumber = "60173304906";
  const message = "Salam GengKubur, saya ada pertanyaan mengenai servis anda.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 group"
      aria-label="Hubungi kami di WhatsApp"
    >
      <div className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:pr-5">
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-bold text-sm">
          Hubungi Kami
        </span>
      </div>
      {/* Pulse Effect */}
      <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping -z-10"></span>
    </a>
  );
};

export default WhatsAppFloat;
