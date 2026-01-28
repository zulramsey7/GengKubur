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
  
  // Placeholder images - in a real app these would come from the database or assets
  const initialImages: GalleryImage[] = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1596483756247-f25b29232938?q=80&w=800&auto=format&fit=crop",
      alt: "Pembersihan Kawasan Kubur",
      category: "Pembersihan"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1558440786-932d0c5a082e?q=80&w=800&auto=format&fit=crop",
      alt: "Pencucian Batu Nisan",
      category: "Pencucian"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1623869733479-7170884d6332?q=80&w=800&auto=format&fit=crop",
      alt: "Kerja-kerja Rumput",
      category: "Landskap"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1623157521039-4467d5192110?q=80&w=800&auto=format&fit=crop",
      alt: "Hasil Selepas Pembersihan",
      category: "Selepas"
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1589923188900-85dae5233271?q=80&w=800&auto=format&fit=crop",
      alt: "Penjagaan Rapi",
      category: "Penyelenggaraan"
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1605218427368-35b85a3ddc2c?q=80&w=800&auto=format&fit=crop",
      alt: "Suasana Tenang",
      category: "Persekitaran"
    }
  ];

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialImages);

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
        
        // Combine DB images with initial images
        setGalleryImages([...dbImages, ...initialImages]);
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
