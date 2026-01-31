import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, X, CheckSquare, Square, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const clearPreview = () => {
    setFile(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById("gallery-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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
      clearPreview();
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
    if (!confirm("Adakah anda pasti mahu memadam gambar ini?")) return;
    
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
      if (selectedImages.includes(id)) {
        setSelectedImages(selectedImages.filter(i => i !== id));
      }
      
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

  const toggleSelect = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`Adakah anda pasti mahu memadam ${selectedImages.length} gambar?`)) return;

    try {
        const imagesToDelete = images.filter(img => selectedImages.includes(img.id));
        
        // Delete from DB
        const { error: dbError } = await supabase
            .from("gallery_images" as any)
            .delete()
            .in("id", selectedImages);

        if (dbError) throw dbError;

        // Delete from Storage
        const fileNames = imagesToDelete
            .map(img => img.image_url.split("/").pop())
            .filter((name): name is string => !!name);
            
        if (fileNames.length > 0) {
            await supabase.storage.from("gallery").remove(fileNames);
        }

        setImages(images.filter(img => !selectedImages.includes(img.id)));
        setSelectedImages([]);
        toast({
            title: "Berjaya",
            description: `${selectedImages.length} gambar telah dipadam`,
        });

    } catch (error) {
        console.error("Bulk delete error:", error);
        toast({
            title: "Ralat",
            description: "Gagal memadam gambar terpilih",
            variant: "destructive"
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
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div className="space-y-4">
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
                <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Muat Naik
                </Button>
            </div>
            
            {/* Preview Section */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 min-h-[200px] bg-muted/20 relative">
                {previewUrl ? (
                    <div className="relative w-full max-w-sm">
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="rounded-lg object-contain max-h-[300px] w-full"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                            onClick={clearPreview}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Pratonton gambar akan muncul di sini</p>
                    </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Galeri Gambar</h2>
            {images.length > 0 && (
                <div className="flex items-center gap-2 ml-4">
                    <Checkbox 
                        id="select-all" 
                        checked={selectedImages.length === images.length && images.length > 0}
                        onCheckedChange={selectAll}
                    />
                    <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
                        Pilih Semua ({images.length})
                    </label>
                </div>
            )}
          </div>
          
          {selectedImages.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Padam ({selectedImages.length})
              </Button>
          )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <Card key={img.id} className={`overflow-hidden group relative border-2 ${selectedImages.includes(img.id) ? 'border-primary' : 'border-transparent'}`}>
              <div className="absolute top-2 left-2 z-10">
                  <Checkbox 
                    checked={selectedImages.includes(img.id)}
                    onCheckedChange={() => toggleSelect(img.id)}
                    className="bg-white/90 border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
              </div>
              
              <div 
                className="relative aspect-square cursor-pointer"
                onClick={() => toggleSelect(img.id)}
              >
                <img 
                  src={img.image_url} 
                  alt={img.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                </div>
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium truncate">{img.title || "Tanpa Tajuk"}</h4>
                <p className="text-xs text-muted-foreground">{img.category}</p>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id, img.image_url);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Padam
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
