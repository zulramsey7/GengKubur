import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationListener = () => {
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('New notification received:', payload);
          const { title, message, icon } = payload.new as any;
          
          // Show Toast (In-App)
          toast(title, {
            description: message,
          });

          // Show System Notification if permission granted
          if (Notification.permission === 'granted') {
             try {
               new Notification(title, {
                 body: message,
                 icon: icon || '/logo.svg'
               });
             } catch (e) {
               console.error("Error showing system notification", e);
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
};
