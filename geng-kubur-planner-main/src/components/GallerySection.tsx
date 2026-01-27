import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
}

const GallerySection = () => {
  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Galeri Projek</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lihat hasil kerja kami dalam membersihkan dan menyelenggara kubur.
          </p>
        </div>

        {images && images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg shadow-lg aspect-square hover:shadow-xl transition-shadow"
              >
                <img
                  src={item.image_url}
                  alt={item.caption || "Gallery image"}
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-300"
                />
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm text-center">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>Tiada gambar di galeri buat masa ini.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
