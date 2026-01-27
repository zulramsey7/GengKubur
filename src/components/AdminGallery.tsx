import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryImage {
  id: string;
  created_at: string;
  title: string;
  category: string;
  image_url: string;
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Pembersihan");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_images" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages((data as any) || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuatkan galeri",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("gallery_images" as any).insert({
        title,
        category,
        image_url: publicUrl,
      });

      if (dbError) throw dbError;

      toast({
        title: "Berjaya",
        description: "Gambar berjaya dimuat naik",
      });

      setTitle("");
      setFile(null);
      // Reset input manually if needed, but simple state clear is fine for now
      const fileInput = document.getElementById("gallery-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchImages();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat naik gambar. Pastikan bucket 'gallery' wujud.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // Delete from DB first
      const { error: dbError } = await supabase
        .from("gallery_images" as any)
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // Extract filename from URL to delete from storage
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
          const { error: storageError } = await supabase.storage
            .from("gallery")
            .remove([fileName]);
            
          if (storageError) console.error("Storage delete error:", storageError);
      }

      setImages(images.filter((img) => img.id !== id));
      toast({
        title: "Berjaya",
        description: "Gambar telah dipadam",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam gambar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Muat Naik Gambar Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tajuk (Pilihan)</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Contoh: Pembersihan Kubur" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pembersihan">Pembersihan</SelectItem>
                  <SelectItem value="Landskap">Landskap</SelectItem>
                  <SelectItem value="Penyelenggaraan">Penyelenggaraan</SelectItem>
                  <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gambar</label>
              <Input 
                id="gallery-upload"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Muat Naik
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Tiada gambar dalam galeri
          </div>
        ) : (
          images.map((img) => (
            <Card key={img.id} className="overflow-hidden group">
              <div className="relative aspect-square">
                <img 
                  src={img.image_url} 
                  alt={img.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(img.id, img.image_url)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Padam
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium truncate">{img.title || "Tanpa Tajuk"}</h4>
                <p className="text-xs text-muted-foreground">{img.category}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
