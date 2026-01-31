import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Berapa lama masa yang diambil untuk membersihkan kubur?",
    answer: "Kebiasaannya proses pembersihan mengambil masa antara 45 minit hingga 1 jam bergantung kepada keadaan semasa kubur (tahap semak samun, dll)."
  },
  {
    question: "Adakah saya perlu hadir semasa pembersihan dijalankan?",
    answer: "Tidak perlu. Anda boleh duduk di rumah dengan tenang. Pihak kami akan menghantar laporan bergambar (Sebelum & Selepas) sejurus kerja selesai melalui WhatsApp atau anda boleh semak status di laman web ini."
  },
  {
    question: "Kawasan mana yang diliputi oleh perkhidmatan ini?",
    answer: "Buat masa ini, fokus utama kami adalah di Tanah Perkuburan Islam Ukay Perdana dan kawasan sekitar Kuala Lumpur. Sila hubungi kami jika anda memerlukan khidmat di lokasi lain."
  },
  {
    question: "Bagaimanakah cara pembayaran?",
    answer: "Kami menerima pembayaran secara dalam talian (Online Transfer / DuitNow) atau Tunai. Resit rasmi akan dikeluarkan selepas pembayaran disahkan."
  },
  {
    question: "Bolehkah saya melanggan pakej bulanan?",
    answer: "Ya, kami ada menyediakan pakej penyelenggaraan berkala (bulanan atau tahunan). Sila pilih pakej 'Penyelenggaraan' atau hubungi kami untuk perbincangan lanjut."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary mb-4">
            Soalan Lazim (FAQ)
          </h2>
          <p className="text-muted-foreground">
            Jawapan kepada persoalan yang sering ditanya oleh pelanggan kami.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;