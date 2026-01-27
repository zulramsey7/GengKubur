import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Music, Save, Loader2 } from "lucide-react";

const MusicSettings = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMusicSetting();
  }, []);

  const fetchMusicSetting = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "background_music_url")
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUrl((data as any).value);
      }
    } catch (error) {
      console.error("Error fetching music setting:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuatkan tetapan muzik.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!url) {
      toast({
        title: "Ralat",
        description: "Sila masukkan URL YouTube.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings" as any)
        .upsert({ 
          key: "background_music_url", 
          value: url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Tetapan muzik telah dikemaskini.",
      });
    } catch (error) {
      console.error("Error saving music setting:", error);
      toast({
        title: "Ralat",
        description: "Gagal menyimpan tetapan muzik.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Tetapan Muzik Latar
        </CardTitle>
        <CardDescription>
          Masukkan URL video YouTube untuk dijadikan muzik latar di halaman utama.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="youtube-url">URL YouTube</Label>
          <div className="flex gap-2">
            <Input
              id="youtube-url"
              placeholder="https://youtu.be/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="ml-2">Simpan</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Contoh: https://youtu.be/_EvTz5qH8HU atau https://www.youtube.com/watch?v=_EvTz5qH8HU
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicSettings;
