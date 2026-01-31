import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GalleryImage {
  id: string | number;
  src: string;
  alt: string;
  category: string;
}

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("gallery_images" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching gallery images:", error);
        return;
      }

      if (data && data.length > 0) {
        const dbImages: GalleryImage[] = (data as any[]).map((item) => ({
          id: item.id,
          src: item.image_url,
          alt: item.title || "Gallery Image",
          category: item.category || "General",
        }));
        
        setGalleryImages(dbImages);
      }
    };

    fetchImages();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:gallery_images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, (payload) => {
        console.log('Real-time update:', payload);
        fetchImages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="gallery" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium mb-4">
            Galeri
          </div>
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Hasil Kerja Kami
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lihat sebahagian daripada hasil kerja penyelenggaraan yang telah kami laksanakan. Kami memastikan setiap kubur dijaga dengan rapi dan hormat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div 
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
              onClick={() => setSelectedImage(image.src)}
            >
              <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Placeholder loading state */}
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 relative z-10"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/600x600?text=${encodeURIComponent(image.alt)}`;
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  Lihat Gambar
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white z-50"
            >
              <X className="h-6 w-6" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Gallery view"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default GallerySection;
