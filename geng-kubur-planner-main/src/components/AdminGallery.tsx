import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, Plus } from "lucide-react";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

const AdminGallery = () => {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ["admin-gallery-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('gallery_items')
        .insert({
          image_url: publicUrl,
          caption: caption || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Berjaya",
        description: "Gambar berjaya dimuat naik",
      });

      setCaption("");
      // Reset input
      event.target.value = "";
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] }); // Invalidate public query too

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik gambar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([fileName]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete from DB even if storage delete fails (might be orphan)
      }

      const { error: dbError } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast({
        title: "Berjaya",
        description: "Gambar berjaya dipadam",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });

    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ralat",
        description: "Gagal memadam gambar",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Pengurusan Galeri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
            <h3 className="text-sm font-medium mb-4">Muat Naik Gambar Baru</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="caption" className="mb-2 block">Kapsyen (Pilihan)</Label>
                <Input
                  id="caption"
                  placeholder="Contoh: Sebelum dan Selepas di Kubur A"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto">
                <Label htmlFor="gallery-upload" className="cursor-pointer">
                  <div className={`flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Sedang Muat Naik..." : "Pilih Gambar"}
                  </div>
                  <Input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </Label>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryItems?.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm">
                  <img
                    src={item.image_url}
                    alt={item.caption || "Gallery image"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="self-end h-8 w-8"
                      onClick={() => handleDelete(item.id, item.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {galleryItems?.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Tiada gambar dalam galeri
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

export default AdminGallery;
