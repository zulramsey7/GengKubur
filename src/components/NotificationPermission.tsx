import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// REPLACE THIS WITH YOUR GENERATED VAPID PUBLIC KEY
const VAPID_PUBLIC_KEY = 'BBD6KDYqYXi-NfrLwG2mxGKI1laRawJF6KeCukcY5lUEG0BvxqXQPK2nNP9keNtacuT5CmlpAjpDLxHTn-PjVPM';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationPermission = ({ isScrolled = true }: { isScrolled?: boolean }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('User Subscribed:', subscription);

      // Save subscription to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('push_subscriptions' as any)
        .insert({
          user_id: user?.id,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer) as any)),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth') as ArrayBuffer) as any)),
        });

      if (error) {
         if (error.code === '23505') { // Unique violation
             console.log('User already subscribed');
         } else {
             throw error;
         }
      }

      toast.success("Notifikasi diaktifkan sepenuhnya!");
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      toast.error("Gagal melanggan notifikasi.");
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error("Pelayar anda tidak menyokong notifikasi.");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success("Kebenaran diterima, sedang mendaftar...");
        await subscribeUser();
      } else {
        toast.error("Notifikasi ditolak.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ralat semasa meminta kebenaran.");
    }
  };

  if (permission === 'granted') {
    return null; 
  }

  return (
    <Button 
      variant={isScrolled ? "outline" : "secondary"}
      size="sm" 
      onClick={requestPermission}
      className={`gap-2 ${!isScrolled ? "bg-white/20 hover:bg-white/30 text-white border-transparent" : ""}`}
    >
      {permission === 'denied' ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      <span className="hidden sm:inline">Notifikasi</span>
    </Button>
  );
};
