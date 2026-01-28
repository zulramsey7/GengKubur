import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function NotificationSender() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Sila isi tajuk dan mesej.");
      return;
    }

    setLoading(true);
    try {
      // 1. Simpan ke database (untuk in-app notification & history)
      const { error } = await supabase
        .from('notifications' as any)
        .insert({ title, message });

      if (error) throw error;

      // 2. Panggil Edge Function (untuk background push notification)
      const { error: funcError } = await supabase.functions.invoke('send-push-notification', {
        body: { record: { title, message, icon: '/logo.svg' } }
      });

      if (funcError) {
        console.error('Push function error:', funcError);
        toast.warning("Disimpan, tapi gagal hantar Push Notification.");
      } else {
        toast.success("Notifikasi dihantar ke semua pengguna!");
      }

      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghantar notifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Hantar Notifikasi Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tajuk Notifikasi</label>
          <Input 
            placeholder="Contoh: Promosi Hari Raya" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mesej</label>
          <Textarea 
            placeholder="Contoh: Dapatkan diskaun 20% untuk pakej pembersihan..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? "Sedang Menghantar..." : (
            <>
              <Send className="mr-2 h-4 w-4" /> Hantar Notifikasi
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
