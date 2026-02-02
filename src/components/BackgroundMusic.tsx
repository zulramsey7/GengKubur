import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";

const BackgroundMusic = () => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const [videoId, setVideoId] = useState<string>("_EvTz5qH8HU"); // Default ID
  const [startTime, setStartTime] = useState<number>(15); // Default start time

  useEffect(() => {
    fetchMusicSetting();

    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.background_music_url'
        },
        (payload) => {
          if (payload.new && payload.new.value) {
             const id = extractVideoId(payload.new.value);
             const start = extractStartTime(payload.new.value);
             if (id) setVideoId(id);
             if (start !== null) setStartTime(start);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMusicSetting = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "background_music_url")
        .single();

      if (data && (data as any).value) {
        const url = (data as any).value;
        const id = extractVideoId(url);
        const start = extractStartTime(url);
        if (id) setVideoId(id);
        if (start !== null) setStartTime(start);
      }
    } catch (error) {
      console.error("Error fetching music setting:", error);
    }
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractStartTime = (url: string) => {
    // Check for t=X or start=X (seconds)
    const timeRegex = /[?&](?:t|start)=(\d+)/;
    const match = url.match(timeRegex);
    if (match) return parseInt(match[1]);
    
    // Check for t=XmYs (e.g., 1m16s)
    const complexTimeRegex = /[?&]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
    const complexMatch = url.match(complexTimeRegex);
    
    if (complexMatch && (complexMatch[1] || complexMatch[2] || complexMatch[3])) {
      const hours = parseInt(complexMatch[1] || '0');
      const minutes = parseInt(complexMatch[2] || '0');
      const seconds = parseInt(complexMatch[3] || '0');
      return (hours * 3600) + (minutes * 60) + seconds;
    }

    return null;
  };

  const onReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    event.target.setVolume(volume);
    // Attempt to play automatically
    event.target.playVideo();
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // PlayerState: 1 = Playing, 2 = Paused
    if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
    
    // Loop functionality: if ended (0), restart
    if (event.data === 0) {
      event.target.seekTo(startTime);
      event.target.playVideo();
    }
  };

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      start: startTime,
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      origin: window.location.origin,
    },
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {/* Hidden YouTube Player */}
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <YouTube 
          videoId={videoId} 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange} 
          onError={(e) => console.warn("YouTube Player Error:", e)}
          key={`${videoId}-${startTime}`} // Re-render on videoId or startTime change
        />
      </div>

      {/* Floating Controls */}
      <div 
        className={cn(
          "bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-2 flex items-center gap-3 shadow-lg transition-all duration-300 hover:bg-black/90",
          isHovered ? "pr-4" : "pr-2"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className={cn(
          "flex items-center gap-2 overflow-hidden transition-all duration-300",
          isHovered ? "w-32 opacity-100" : "w-0 opacity-0"
        )}>
          <button 
            onClick={toggleMute}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          <Slider.Root
            className="relative flex items-center select-none touch-none w-20 h-5"
            defaultValue={[50]}
            value={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
          >
            <Slider.Track className="bg-white/20 relative grow rounded-full h-[3px]">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full shadow-[0_2px_10px] shadow-blackA7 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Volume"
            />
          </Slider.Root>
        </div>
      </div>
    </div>
  );
};

export default BackgroundMusic;
